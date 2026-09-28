/**
 * opencode.ts — the OpenCode (opencode.ai) dispatch — the throw path.
 *
 * Parallel to the Claude Code Pre/Post/Stop exit-code dispatch in
 * commands/check.ts. Same rule pipeline (regex first, semantic layer
 * per the existing order, via collectBlockingFindings) and the same
 * activity.log vocabulary — but the caller never reads a process exit
 * code:
 *
 *   handleOpenCodeToolEvent("pre" | "post", call, opts)
 *     → { status: "allow" | "block", message?, activityResult }
 *
 * The plugin `prism init` generates (.opencode/plugin/prism.js) calls
 * this in-process (package export `@prism-engine/cli/hook-runtime`)
 * inside tool.execute.before / tool.execute.after and THROWS `message`
 * on a block. Throwing is the only blocking mechanism the OpenCode SDK
 * has — hooks return Promise<void>, there is no exit-2/permissionDecision
 * protocol, and the host process exit code stays 0 regardless.
 *
 * Activity-log writes happen INSIDE this handler at each decision point
 * — a new call site, never inferred from a subprocess's exit status.
 * Vocabulary is unchanged: CLEAN, BLOCKED <rule-id>[,...],
 * SKIPPED <reason>. One line per (event, file) — multi-file
 * apply_patch calls log one line per touched file.
 *
 * Gated tools: write, edit, multiedit, apply_patch (OpenCode's own
 * names). apply_patch carries its payload as a single `patchText`
 * string; its pre-phase gates on the lines the patch ADDS (context and
 * removed lines are excluded so removals can never false-positive) and
 * its post-phase checks every touched file on disk — the same
 * pre-block-else-safety-net shape as the Claude path. bash and other
 * command tools are deliberately NOT gated here — bash gating is a
 * separate pending decision.
 *
 * Fails open on every skip path (same contract as the Claude path):
 * PRISM_DISABLE=1, no rules, non-applicable extension, un-extractable
 * content, unreadable file, engine error.
 */

import { existsSync, readFileSync } from "fs";
import { dirname, extname, isAbsolute, join, resolve } from "path";
import { findRulesPath, loadRuleSet } from "./parse.js";
import { applicableExtensions } from "./engine.js";
import { formatHookForAgent } from "./format.js";
import {
  appendActivity,
  formatActivityLine,
  resolveActivityLogPath,
} from "./activity.js";
import {
  blockedResult,
  cleanResult,
  collectBlockingFindings,
  extractFilePath,
  extractProposedContent,
  type BlockingCheckResult,
  type HookEvent,
  type HookToolInput,
} from "../commands/check.js";
import type { RuleSet } from "./types.js";

export type OpenCodePhase = "pre" | "post";

export interface OpenCodeToolCall {
  /** OpenCode tool name as received by the hook (e.g. "write", "edit"). */
  tool: string;
  /** The tool's own argument shape — OpenCode uses camelCase keys
   *  (filePath / oldString / newString / replaceAll) and `patchText`
   *  for apply_patch. */
  args?: Record<string, unknown> | null;
}

export interface OpenCodeHandleOptions {
  /** Session directory (the plugin's `input.directory`). Used to resolve
   *  relative tool paths and as the activity-log fallback when no
   *  ruleset is found — same role as the `cwd` field in Claude payloads. */
  cwd?: string | null;
}

export interface OpenCodeOutcome {
  status: "allow" | "block";
  /** Correction text the plugin throws as the Error message on a block. */
  message?: string;
  /** The activity result(s) written this call (CLEAN / BLOCKED … /
   *  SKIPPED …). Single-target calls return that one string;
   *  multi-file calls join them with " | ". null = nothing logged. */
  activityResult: string | null;
}

/** File-editing tools this dispatch gates. OpenCode's own names. bash and
 *  every other command tool are deliberately absent — bash gating is a
 *  pending decision, not built here. */
const OPENCODE_FILE_TOOLS = new Set([
  "write",
  "edit",
  "multiedit",
  "apply_patch",
]);

/**
 * Strict mode (fail-closed) — enabled by the presence of `.prism/strict`
 * in the project directory. Only a human removes the marker; nothing in
 * any agent-facing message says how. With the marker, an unavailable
 * engine BLOCKS the gated tools with a fixed "PRISM NOT ACTIVE" message
 * and a `BLOCKED prism-unavailable:<reason>` activity line instead of
 * failing open. Without the marker every path below is byte-for-byte the
 * original fail-open behavior.
 */
export const STRICT_MARKER = join(".prism", "strict");

export type StrictUnavailableReason =
  | "prism-disable"
  | "rules-missing"
  | "rules-invalid"
  | "rules-empty"
  | "engine-error"
  | "handler-error"
  | "runtime-import-failed";

export function strictEnabled(cwd: string | null): boolean {
  if (!cwd) return false;
  try {
    return existsSync(join(cwd, STRICT_MARKER));
  } catch {
    return false;
  }
}

export function strictUnavailableMessage(reason: StrictUnavailableReason): string {
  return `PRISM NOT ACTIVE (fail-closed): ${reason}. Stop and tell Jeff. Do not work around this.`;
}

/**
 * Map an OpenCode tool call into the shared HookEvent shape the existing
 * extraction logic already understands (snake_case tool_input). Returns
 * null for anything that is not a gated file tool — those are never
 * examined, logged, or blocked on this path.
 */
export function toHookEvent(call: OpenCodeToolCall): HookEvent | null {
  const tool = typeof call.tool === "string" ? call.tool.toLowerCase() : "";
  if (!OPENCODE_FILE_TOOLS.has(tool)) return null;

  const raw =
    call.args && typeof call.args === "object" && !Array.isArray(call.args)
      ? (call.args as Record<string, unknown>)
      : {};

  const input: HookToolInput = {};
  const filePath = pickString(raw, "filePath", "file_path");
  if (filePath !== undefined) input.file_path = filePath;
  if (typeof raw.content === "string") input.content = raw.content;
  const oldString = pickString(raw, "oldString", "old_string");
  if (oldString !== undefined) input.old_string = oldString;
  const newString = pickString(raw, "newString", "new_string");
  if (newString !== undefined) input.new_string = newString;
  if (raw.replaceAll !== undefined) input.replace_all = raw.replaceAll;
  else if (raw.replace_all !== undefined) input.replace_all = raw.replace_all;
  if (Array.isArray(raw.edits)) input.edits = raw.edits;

  return { tool_name: tool, tool_input: input };
}

function pickString(
  args: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = args[key];
    // Empty strings are kept on purpose: the extraction layer has its own
    // `empty-old-string` reason and must see the empty value to report it.
    if (typeof value === "string") return value;
  }
  return undefined;
}

/**
 * Parse an apply_patch payload into its file sections. Strict,
 * fail-open parsing: headers are `*** <Verb> File: <path>` lines; only
 * lines beginning with `+` count as content (they are the additions —
 * context and `-` lines are what the patch replaces, and matching on
 * those would false-positive on removals). Anything unparseable yields
 * no sections and the call passes through ungated rather than guessing.
 */
export interface ApplyPatchSection {
  path: string;
  added: string[];
}

export function parseApplyPatchSections(patchText: string): ApplyPatchSection[] {
  const sections: ApplyPatchSection[] = [];
  let current: ApplyPatchSection | null = null;
  for (const line of patchText.split(/\r?\n/)) {
    const header =
      /^\*\*\*\s+(?:Add|Update|Delete)\s+File:\s*(.+?)\s*$/.exec(line);
    if (header && header[1]) {
      current = { path: header[1], added: [] };
      sections.push(current);
      continue;
    }
    if (current && line.startsWith("+")) current.added.push(line.slice(1));
  }
  return sections;
}

interface OpenCodeTarget {
  /** The path as the agent knows it (used for activity lines + checks). */
  path: string;
  /** Pre-phase content reconstruction. Undefined (apply_patch) →
   *  SKIPPED no-proposed-content on the pre path; post always reads disk. */
  proposed?: () => ReturnType<typeof extractProposedContent>;
}

/** One (event, file) decision. Writes its own activity line. */
interface FileDecision {
  result: string;
  blocks?: { file: string; blocks: NonNullable<BlockingCheckResult["blocks"]> };
  /** Set when strict mode converted a fail-open skip into an availability
   *  block; the caller turns it into the thrown message. */
  unavailable?: StrictUnavailableReason;
}

/**
 * Evaluate one tool event and return the decision. Writes the activity
 * lines itself, at the decision points — no exit code, no subprocess.
 *
 * The plugin turns a "block" outcome into `throw new Error(message)`;
 * everything else (allow, every skip path) falls through untouched.
 */
export async function handleOpenCodeToolEvent(
  phase: OpenCodePhase,
  call: OpenCodeToolCall,
  options: OpenCodeHandleOptions = {},
): Promise<OpenCodeOutcome> {
  const tool = typeof call.tool === "string" ? call.tool.toLowerCase() : "";
  const gated = OPENCODE_FILE_TOOLS.has(tool);

  const cwd =
    typeof options.cwd === "string" && options.cwd.length > 0
      ? options.cwd
      : null;

  const strict = gated && strictEnabled(cwd);

  if (process.env.PRISM_DISABLE === "1") {
    if (strict) {
      const target = resolveTargets(tool, call, cwd)[0];
      return strictBlock("prism-disable", cwd, phase, target?.path ?? "-");
    }
    return allow();
  }

  if (!gated) return allow();

  const targets = resolveTargets(tool, call, cwd);
  const first = targets[0];
  if (!first) return allow();

  const found = findRulesPath(dirname(resolvePath(first.path, cwd)));
  if (!found) {
    console.error("[prism] check skipped: no .prism/rules.json found");
    if (strict) return strictBlock("rules-missing", cwd, phase, first.path);
    return allow(
      logged(
        resolveActivityLogPath(null, cwd),
        phase,
        first.path,
        "SKIPPED no-rules",
      ),
    );
  }

  let ruleSet: RuleSet;
  try {
    ruleSet = loadRuleSet(found);
  } catch (err) {
    console.error(`[prism] check skipped: ${errorMessage(err)}`);
    if (strict) return strictBlock("rules-invalid", cwd, phase, first.path, found);
    return allow();
  }

  if (strict && ruleSet.rules.length === 0) {
    return strictBlock("rules-empty", cwd, phase, first.path, found);
  }

  const logPath = resolveActivityLogPath(found, cwd);
  const decisions: FileDecision[] = [];

  for (const target of targets) {
    decisions.push(
      await evaluateTarget(phase, target, cwd, logPath, ruleSet, strict),
    );
  }

  const unavailable = decisions.find((d) => d.unavailable !== undefined);
  if (unavailable) {
    return {
      status: "block",
      message: strictUnavailableMessage(unavailable.unavailable!),
      activityResult: decisions.map((d) => d.result).join(" | ") || null,
    };
  }

  const resultText = decisions.map((d) => d.result).join(" | ");
  const blocking = decisions.filter(
    (d): d is FileDecision & { blocks: NonNullable<FileDecision["blocks"]> } =>
      d.blocks !== undefined,
  );

  if (blocking.length === 0) return allow(resultText || null);

  const message = blocking
    .map(({ blocks }) => formatHookForAgent("opencode", blocks.file, blocks.blocks))
    .join("\n\n");
  return { status: "block", message, activityResult: resultText || null };
}

/** Strict-mode availability block: logs the fixed prism-unavailable line
 *  and returns the throw-ready outcome. */
function strictBlock(
  reason: StrictUnavailableReason,
  cwd: string | null,
  phase: OpenCodePhase,
  file: string,
  rulesPath: string | null = null,
): OpenCodeOutcome {
  const result = `BLOCKED prism-unavailable:${reason}`;
  appendActivity(
    resolveActivityLogPath(rulesPath, cwd),
    formatActivityLine(phase, file, result),
  );
  return {
    status: "block",
    message: strictUnavailableMessage(reason),
    activityResult: result,
  };
}

/** Which files does this call want to touch, and how can we see the
 *  content it is about to write? */
function resolveTargets(
  tool: string,
  call: OpenCodeToolCall,
  cwd: string | null,
): OpenCodeTarget[] {
  if (tool === "apply_patch") {
    const raw = call.args ?? {};
    const patchText =
      typeof raw.patchText === "string"
        ? raw.patchText
        : typeof raw.patch === "string"
          ? raw.patch
          : "";
    if (!patchText) return [];
    return parseApplyPatchSections(patchText).map(({ path, added }) => ({
      path,
      // Pre-phase: gate on the lines this patch ADDS. Post-phase ignores
      // this and reads the file from disk.
      proposed: () => ({ ok: true as const, content: added.join("\n") }),
    }));
  }

  const event = toHookEvent(call);
  if (!event) return [];
  const path = extractFilePath(event);
  if (!path) return [];
  return [{ path, proposed: () => extractProposedContent(event) }];
}

async function evaluateTarget(
  phase: OpenCodePhase,
  target: OpenCodeTarget,
  cwd: string | null,
  logPath: string | null,
  ruleSet: RuleSet,
  strict: boolean,
): Promise<FileDecision> {
  const filePath = target.path;

  if (!applicableExtensions(ruleSet).has(extname(filePath).toLowerCase())) {
    return decision(logPath, phase, filePath, "SKIPPED not-applicable");
  }

  let content: string;
  if (phase === "pre") {
    if (!target.proposed) {
      return decision(
        logPath,
        phase,
        filePath,
        "SKIPPED no-proposed-content",
      );
    }
    const proposed = target.proposed();
    if (!proposed.ok) {
      return decision(logPath, phase, filePath, `SKIPPED ${proposed.reason}`);
    }
    content = proposed.content;
  } else {
    try {
      content = readFileSync(resolvePath(filePath, cwd), "utf8");
    } catch {
      console.error("[prism] check skipped: edited file is not readable");
      return decision(logPath, phase, filePath, "SKIPPED file-unreadable");
    }
  }

  let check: BlockingCheckResult;
  try {
    check = await collectBlockingFindings(filePath, content, ruleSet);
  } catch (err) {
    console.error(`[prism] check skipped: engine error: ${errorMessage(err)}`);
    if (strict) {
      return decision(
        logPath,
        phase,
        filePath,
        "BLOCKED prism-unavailable:engine-error",
        "engine-error",
      );
    }
    return decision(logPath, phase, filePath, "SKIPPED engine-error");
  }

  if (check.blocks.length === 0) {
    return decision(
      logPath,
      phase,
      filePath,
      cleanResult(check.semanticSkipReason),
    );
  }

  const result = blockedResult(check.blocks);
  appendActivity(logPath, formatActivityLine(phase, filePath, result));
  return { result, blocks: { file: filePath, blocks: check.blocks } };
}

function decision(
  logPath: string | null,
  phase: OpenCodePhase,
  file: string,
  result: string,
  unavailable?: StrictUnavailableReason,
): FileDecision {
  appendActivity(logPath, formatActivityLine(phase, file, result));
  return unavailable !== undefined ? { result, unavailable } : { result };
}

function allow(activityResult: string | null = null): OpenCodeOutcome {
  return { status: "allow", activityResult };
}

function logged(
  logPath: string | null,
  phase: OpenCodePhase,
  file: string,
  result: string,
): string {
  appendActivity(logPath, formatActivityLine(phase, file, result));
  return result;
}

/** Relative tool paths resolve against the session directory when we
 *  know it, else the host process cwd (single-shot `opencode run`
 *  already starts in the project dir). */
function resolvePath(filePath: string, cwd: string | null): string {
  if (isAbsolute(filePath)) return resolve(filePath);
  if (cwd) return resolve(cwd, filePath);
  return resolve(filePath);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
