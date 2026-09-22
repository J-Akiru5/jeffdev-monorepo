/**
 * check command — the Pass
 *
 * Local enforcement of .prism/rules.json against files an agent writes.
 *
 *   prism check <files...>   lint mode — prints findings, exit 1 on blocks
 *   prism check --hook       agent hook mode — reads a Claude Code (or
 *                            Cursor/Antigravity) hook event JSON from stdin
 *                            and dispatches on the event name:
 *                              PreToolUse  — reconstruct the PROPOSED content
 *                                            (Write content / Edit old→new /
 *                                            MultiEdit edits in order), check
 *                                            it, and exit 2 to halt the write
 *                                            before it lands on disk
 *                              PostToolUse — re-check the file read from disk
 *                                            (safety net; cannot undo a write)
 *                              Stop        — check session-changed files (from
 *                                            transcript_path, with a source-dir
 *                                            fallback) and exit 2 to refuse
 *                                            session end while blocks remain
 *
 * Hook mode fails open: missing/malformed rules, unreadable files, engine
 * errors and kill switch (PRISM_DISABLE=1) all exit 0 without blocking.
 * Anything unexpected during PreToolUse extraction (unknown tool shape,
 * old_string not found, unreadable base file) also exits 0 — never guess.
 *
 * Every invocation appends one line to .prism/activity.log (observability
 * only; a logging failure never changes the exit behavior).
 *
 * Semantic layer (opt-in, PRISM_GEMINI_CHECK=1 + key): when the deterministic
 * regex engine finds no blocking violations, a Gemini call (default
 * gemini-3.6-flash, 12s hard cap, tunable via PRISM_GEMINI_TIMEOUT_MS) checks
 * the same content for intent-level violations regex cannot see. It is
 * strictly additive and itself fails open — any error/timeout falls back to
 * the deterministic result alone. The Stop gate is deterministic-only: one
 * model call per changed file could exceed the hook timeout.
 */

import chalk from "chalk";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, extname, join, resolve } from "path";
import { findRulesPath, loadRuleSet } from "../rules/parse.js";
import { applicableExtensions, checkContent } from "../rules/engine.js";
import {
  formatHookClaudeCode,
  formatHookForAgent,
  formatPretty,
  normalizeHookFormat,
  type HookFormat,
} from "../rules/format.js";
import type { Finding, RuleSet } from "../rules/types.js";
import { runSemanticCheck, semanticEnabled } from "../rules/semantic.js";
import {
  appendActivity,
  formatActivityLine,
  resolveActivityLogPath,
  type ActivityEvent,
} from "../rules/activity.js";
import { changedFilesFromTranscript } from "../rules/transcript.js";

const MAX_STDIN_BYTES = 1024 * 1024;
const HOOK_TOOL_PATTERN = /Write|Edit/i;
const FILE_EDIT_TOOLS = new Set(["write", "edit", "multiedit"]);
/** Safety bound for the Stop fallback source-dir walk. */
const STOP_SCAN_FILE_CAP = 500;

interface CheckOptions {
  rules?: string;
  hook?: boolean;
  format?: string;
}

export interface HookToolInput {
  file_path?: unknown;
  content?: unknown;
  old_string?: unknown;
  new_string?: unknown;
  replace_all?: unknown;
  edits?: unknown;
}

/**
 * Hook event payloads differ per agent. Claude Code nests the path under
 * tool_input; Cursor sends file_path at the top level (its hooks.json
 * auto-mapping of .claude settings also emits Cursor's shape); Antigravity
 * 2.0 nests it under toolCall.args (camelCase keys). Accepting the superset
 * keeps the Claude Code contract byte-identical while making one formatter
 * serve every agent.
 */
export interface HookEvent {
  tool_name?: unknown;
  hook_event_name?: unknown;
  hookEventName?: unknown;
  tool_input?: HookToolInput;
  file_path?: unknown;
  filePath?: unknown;
  cwd?: unknown;
  transcript_path?: unknown;
  stop_hook_active?: unknown;
  toolCall?: { name?: unknown; args?: Record<string, unknown> };
}

/** Path keys Antigravity's file-edit tools may use inside toolCall.args.
 *  The docs' own payload examples use PascalCase keys (e.g. DirectoryPath
 *  for list_dir), so both casings are accepted defensively. */
const TOOL_CALL_PATH_KEYS = [
  "filePath",
  "FilePath",
  "file_path",
  "path",
  "file",
] as const;

export function extractFilePath(event: HookEvent): string | null {
  const nested = event.tool_input?.file_path;
  if (typeof nested === "string" && nested.length > 0) return nested;
  if (typeof event.file_path === "string" && event.file_path.length > 0)
    return event.file_path;
  if (typeof event.filePath === "string" && event.filePath.length > 0)
    return event.filePath;
  const args = event.toolCall?.args;
  if (args && typeof args === "object") {
    for (const key of TOOL_CALL_PATH_KEYS) {
      const value = args[key];
      if (typeof value === "string" && value.length > 0) return value;
    }
  }
  return null;
}

function extractToolName(event: HookEvent): string | null {
  if (typeof event.tool_name === "string") return event.tool_name;
  if (typeof event.hook_event_name === "string")
    return event.hook_event_name;
  return null;
}

export function extractHookEventName(event: HookEvent): string | null {
  if (typeof event.hook_event_name === "string") return event.hook_event_name;
  if (typeof event.hookEventName === "string") return event.hookEventName;
  return null;
}

export type HookMode = "pre" | "post" | "stop";

/** Claude Code sends snake_case `hook_event_name`; Antigravity's shape is
 *  camelCase. Legacy payloads (and Cursor's afterFileEdit mapping) had no
 *  event name at all and behaved as post-write checks — keep that default. */
export function resolveHookMode(event: HookEvent): HookMode {
  const name = extractHookEventName(event);
  if (!name) return "post";
  const lower = name.toLowerCase();
  if (lower.includes("stop")) return "stop";
  if (lower.includes("pre")) return "pre";
  return "post";
}

/** The Stop loop guard: once a Stop hook has already blocked in this stop
 *  cycle, Claude Code sets stop_hook_active. Never block again on that flag
 *  or the session can never end. */
export function shouldBlockStop(event: HookEvent): boolean {
  return event.stop_hook_active !== true;
}

export type ProposedExtraction =
  | { ok: true; content: string }
  | { ok: false; reason: string };

/**
 * Reconstruct the content a PreToolUse event is about to write:
 *  - Write      → tool_input.content (no disk read; the file may not exist)
 *  - Edit       → read current contents, apply old_string → new_string
 *  - MultiEdit  → read current contents, apply edits[] in order
 * Every ambiguous or unreadable case returns a reason instead of guessing;
 * the caller logs it and fails open (exit 0).
 */
export function extractProposedContent(
  event: HookEvent,
  readFile: (path: string) => string = (path) => readFileSync(path, "utf8"),
): ProposedExtraction {
  const input = event.tool_input;
  if (!input || typeof input !== "object") {
    return { ok: false, reason: "missing-tool-input" };
  }
  const filePath = extractFilePath(event);
  if (!filePath) return { ok: false, reason: "missing-file-path" };

  // Write: proposed content is in the payload — never read the target.
  if (typeof input.content === "string") {
    return { ok: true, content: input.content };
  }

  // MultiEdit: edits[] applied in order against the current file contents.
  if (Array.isArray(input.edits)) {
    let content: string;
    try {
      content = readFile(filePath);
    } catch {
      return { ok: false, reason: "file-unreadable" };
    }
    for (const rawEdit of input.edits) {
      const applied = applyEdit(content, rawEdit);
      if (!applied.ok) return applied;
      content = applied.content;
    }
    return { ok: true, content };
  }

  // Edit: single old_string → new_string against the current contents.
  if (
    typeof input.old_string === "string" ||
    typeof input.new_string === "string"
  ) {
    let content: string;
    try {
      content = readFile(filePath);
    } catch {
      return { ok: false, reason: "file-unreadable" };
    }
    return applyEdit(content, input);
  }

  return { ok: false, reason: "no-proposed-content" };
}

function applyEdit(content: string, rawEdit: unknown): ProposedExtraction {
  if (!rawEdit || typeof rawEdit !== "object" || Array.isArray(rawEdit)) {
    return { ok: false, reason: "malformed-edit" };
  }
  const edit = rawEdit as HookToolInput;
  if (
    typeof edit.old_string !== "string" ||
    typeof edit.new_string !== "string"
  ) {
    return { ok: false, reason: "malformed-edit" };
  }
  if (edit.old_string === "") return { ok: false, reason: "empty-old-string" };
  const index = content.indexOf(edit.old_string);
  if (index === -1) return { ok: false, reason: "old-string-not-found" };
  if (edit.replace_all === true) {
    return {
      ok: true,
      content: content.split(edit.old_string).join(edit.new_string),
    };
  }
  return {
    ok: true,
    content:
      content.slice(0, index) +
      edit.new_string +
      content.slice(index + edit.old_string.length),
  };
}

export async function check(
  files: string[],
  options: CheckOptions = {},
): Promise<void> {
  if (options.hook) {
    await runHook(options.format);
    return;
  }
  runStandalone(files, options.rules);
}

async function runHook(formatFlag?: string): Promise<void> {
  if (process.env.PRISM_DISABLE === "1") return;

  const format = normalizeHookFormat(formatFlag);

  const event = (await readStdinJson()) as HookEvent | null;
  if (!event) return;

  try {
    const mode = resolveHookMode(event);
    if (mode === "stop") {
      runStopHook(event, format);
      return;
    }
    if (mode === "pre") {
      await runPreToolUse(event, format);
      return;
    }
    await runPostToolUse(event, format);
  } catch {
    // Fail open on anything unexpected — same contract as every skip path.
  }
}

async function runPreToolUse(
  event: HookEvent,
  format: HookFormat,
): Promise<void> {
  const toolName = extractToolName(event);
  if (toolName !== null && !isFileEditTool(toolName)) return;

  const filePath = extractFilePath(event);
  if (!filePath) return;

  const cwd = extractCwd(event);

  let rulesPath: string;
  let ruleSet: RuleSet;
  try {
    const found = findRulesPath(dirname(resolve(filePath)));
    if (!found) {
      console.error("[prism] check skipped: no .prism/rules.json found");
      logHookEvent(resolveActivityLogPath(null, cwd), "pre", filePath, "SKIPPED no-rules");
      return;
    }
    rulesPath = found;
    ruleSet = loadRuleSet(rulesPath);
  } catch (err) {
    console.error(`[prism] check skipped: ${errorMessage(err)}`);
    return;
  }

  const logPath = resolveActivityLogPath(rulesPath, cwd);

  if (!applicableExtensions(ruleSet).has(extname(filePath).toLowerCase())) {
    logHookEvent(logPath, "pre", filePath, "SKIPPED not-applicable");
    return;
  }

  const proposed = extractProposedContent(event);
  if (!proposed.ok) {
    logHookEvent(logPath, "pre", filePath, `SKIPPED ${proposed.reason}`);
    return;
  }

  let blocks: Finding[];
  try {
    blocks = await collectBlockingFindings(filePath, proposed.content, ruleSet);
  } catch (err) {
    console.error(`[prism] check skipped: engine error: ${errorMessage(err)}`);
    logHookEvent(logPath, "pre", filePath, "SKIPPED engine-error");
    return;
  }

  if (blocks.length === 0) {
    logHookEvent(logPath, "pre", filePath, "CLEAN");
    return;
  }

  logHookEvent(logPath, "pre", filePath, blockedResult(blocks));
  writeHookCorrection(format, filePath, blocks);
}

async function runPostToolUse(
  event: HookEvent,
  format: HookFormat,
): Promise<void> {
  const toolName = extractToolName(event);
  if (toolName !== null && !HOOK_TOOL_PATTERN.test(toolName)) {
    return;
  }
  const filePath = extractFilePath(event);
  if (!filePath) return;

  const cwd = extractCwd(event);

  let rulesPath: string;
  let ruleSet: RuleSet;
  try {
    const found = findRulesPath(dirname(resolve(filePath)));
    if (!found) {
      console.error("[prism] check skipped: no .prism/rules.json found");
      logHookEvent(resolveActivityLogPath(null, cwd), "post", filePath, "SKIPPED no-rules");
      return;
    }
    rulesPath = found;
    ruleSet = loadRuleSet(rulesPath);
  } catch (err) {
    console.error(`[prism] check skipped: ${errorMessage(err)}`);
    return;
  }

  const logPath = resolveActivityLogPath(rulesPath, cwd);

  if (!applicableExtensions(ruleSet).has(extname(filePath).toLowerCase())) {
    logHookEvent(logPath, "post", filePath, "SKIPPED not-applicable");
    return;
  }

  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    console.error("[prism] check skipped: edited file is not readable");
    logHookEvent(logPath, "post", filePath, "SKIPPED file-unreadable");
    return;
  }

  let blocks: Finding[];
  try {
    blocks = await collectBlockingFindings(filePath, content, ruleSet);
  } catch (err) {
    console.error(`[prism] check skipped: engine error: ${errorMessage(err)}`);
    logHookEvent(logPath, "post", filePath, "SKIPPED engine-error");
    return;
  }

  if (blocks.length === 0) {
    logHookEvent(logPath, "post", filePath, "CLEAN");
    return;
  }

  logHookEvent(logPath, "post", filePath, blockedResult(blocks));
  writeHookCorrection(format, filePath, blocks);
}

/**
 * Stop gate: deterministic-only (semantic calls per changed file could
 * exceed the hook timeout) over the files this session edited, derived from
 * the transcript with a source-dir walk as fallback. Any violation keeps
 * the session open with the standard per-file correction output.
 */
function runStopHook(event: HookEvent, format: HookFormat): void {
  const cwd = extractCwd(event) ?? process.cwd();

  let rulesPath: string | null = null;
  let ruleSet: RuleSet | null = null;
  try {
    rulesPath = findRulesPath(cwd);
    if (rulesPath) ruleSet = loadRuleSet(rulesPath);
  } catch {
    return;
  }

  const logPath = resolveActivityLogPath(rulesPath, cwd);

  if (!shouldBlockStop(event)) {
    logHookEvent(logPath, "stop", "-", "SKIPPED stop-hook-active");
    return;
  }
  if (!ruleSet) {
    logHookEvent(logPath, "stop", "-", "SKIPPED no-rules");
    return;
  }

  const applicable = applicableExtensions(ruleSet);
  const transcriptPath = extractTranscriptPath(event);
  let source: "transcript" | "scan" = "transcript";
  let candidates = transcriptPath
    ? changedFilesFromTranscript(transcriptPath)
    : [];
  candidates = dedupeApplicableExisting(candidates, applicable);
  if (candidates.length === 0) {
    source = "scan";
    candidates = scanSourceDir(
      process.env.PRISM_STOP_SCAN_DIR ?? cwd,
      applicable,
    );
  }
  candidates = candidates.slice(0, STOP_SCAN_FILE_CAP);

  const byFile = new Map<string, Finding[]>();
  for (const file of candidates) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    let findings: Finding[];
    try {
      findings = checkContent(file, content, ruleSet);
    } catch {
      continue;
    }
    const blocks = findings.filter((f) => f.severity === "block");
    if (blocks.length > 0) byFile.set(file, blocks);
  }

  if (byFile.size === 0) {
    logHookEvent(logPath, "stop", describeFiles(candidates, source), "CLEAN");
    return;
  }

  const ruleIds = [
    ...new Set([...byFile.values()].flat().map((f) => f.ruleId)),
  ];
  logHookEvent(
    logPath,
    "stop",
    describeFiles([...byFile.keys()], source),
    `BLOCKED ${ruleIds.join(",")}`,
  );

  const sections = [...byFile.entries()].map(([file, blocks]) =>
    renderCorrection(format, file, blocks),
  );
  process.stderr.write(`${sections.join("\n\n")}\n`);
  process.exitCode = 2;
}

/**
 * Regex first; the semantic layer only when the deterministic pass found no
 * blocking violations (same order the hook has always used). Semantic
 * findings are returned as-is — its own parser already maps them to the
 * ruleset's severities, and the layer never throws.
 */
async function collectBlockingFindings(
  filePath: string,
  content: string,
  ruleSet: RuleSet,
): Promise<Finding[]> {
  const findings = checkContent(filePath, content, ruleSet);
  const blocks = findings.filter((f) => f.severity === "block");
  if (blocks.length > 0) return blocks;
  if (!semanticEnabled()) return [];
  return runSemanticCheck(filePath, content, ruleSet);
}

function isFileEditTool(name: string): boolean {
  return FILE_EDIT_TOOLS.has(name.toLowerCase());
}

function extractCwd(event: HookEvent): string | null {
  return typeof event.cwd === "string" && event.cwd.length > 0
    ? event.cwd
    : null;
}

function extractTranscriptPath(event: HookEvent): string | null {
  return typeof event.transcript_path === "string" &&
    event.transcript_path.length > 0
    ? event.transcript_path
    : null;
}

function dedupeApplicableExisting(
  files: string[],
  applicable: Set<string>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const file of files) {
    const key = resolve(file);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!applicable.has(extname(file).toLowerCase())) continue;
    if (!existsSync(file)) continue;
    out.push(file);
  }
  return out;
}

function scanSourceDir(dir: string, applicable: Set<string>): string[] {
  const out = new Set<string>();
  walkDir(resolve(dir), applicable, out);
  return [...out].sort();
}

function describeFiles(files: string[], source: string): string {
  if (files.length === 0) return `${source}:none`;
  const head = files.slice(0, 3).join(";");
  return files.length > 3 ? `${head};+${files.length - 3} more` : head;
}

function blockedResult(blocks: Finding[]): string {
  const ids = [...new Set(blocks.map((block) => block.ruleId))];
  return `BLOCKED ${ids.join(",")}`;
}

function logHookEvent(
  logPath: string | null,
  event: ActivityEvent,
  file: string,
  result: string,
): void {
  appendActivity(logPath, formatActivityLine(event, file, result));
}

function renderCorrection(
  format: HookFormat,
  filePath: string,
  blocks: Finding[],
): string {
  return format === "claude-code"
    ? formatHookClaudeCode(filePath, blocks)
    : formatHookForAgent(format, filePath, blocks);
}

function writeHookCorrection(
  format: HookFormat,
  filePath: string,
  blocks: Finding[],
): void {
  process.stderr.write(`${renderCorrection(format, filePath, blocks)}\n`);
  process.exitCode = 2;
}

function runStandalone(files: string[], rulesOverride?: string): void {
  if (files.length === 0) {
    console.error(chalk.red("prism check: no files given."));
    console.error("Usage: prism check <file|dir...> [--rules <path>]");
    process.exitCode = 2;
    return;
  }

  let ruleSet: RuleSet;
  try {
    const rulesPath = rulesOverride ?? findRulesPath(process.cwd());
    if (!rulesPath) {
      throw new Error(
        "no .prism/rules.json found (searched upward from the current directory)",
      );
    }
    ruleSet = loadRuleSet(rulesPath);
  } catch (err) {
    console.error(chalk.red(`prism check: ${errorMessage(err)}`));
    process.exitCode = 2;
    return;
  }

  const allowed = applicableExtensions(ruleSet);
  const targets = expandTargets(files, allowed);

  const byFile = new Map<string, Finding[]>();
  const readErrors: string[] = [];
  let blocks = 0;
  let warns = 0;

  for (const target of targets) {
    let content: string;
    try {
      content = readFileSync(target, "utf8");
    } catch (err) {
      readErrors.push(`cannot read ${target}: ${errorMessage(err)}`);
      continue;
    }
    const findings = checkContent(target, content, ruleSet);
    if (findings.length === 0) continue;
    byFile.set(target, findings);
    blocks += findings.filter((f) => f.severity === "block").length;
    warns += findings.filter((f) => f.severity === "warn").length;
  }

  console.log(formatPretty(byFile, blocks, warns));
  for (const error of readErrors) {
    console.error(chalk.red(`prism check: ${error}`));
  }
  if (readErrors.length > 0) {
    process.exitCode = 2;
  } else if (blocks > 0) {
    process.exitCode = 1;
  }
}

function expandTargets(inputs: string[], allowedExt: Set<string>): string[] {
  const out = new Set<string>();
  for (const input of inputs) {
    const resolved = resolve(input);
    let stats;
    try {
      stats = statSync(resolved);
    } catch {
      out.add(resolved);
      continue;
    }
    if (stats.isDirectory()) {
      walkDir(resolved, allowedExt, out);
    } else if (allowedExt.has(extname(resolved).toLowerCase())) {
      out.add(resolved);
    }
  }
  return [...out].sort();
}

function walkDir(dir: string, allowedExt: Set<string>, out: Set<string>): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, allowedExt, out);
    } else if (allowedExt.has(extname(full).toLowerCase())) {
      out.add(full);
    }
  }
}

async function readStdinJson(): Promise<HookEvent | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_STDIN_BYTES) return null;
    chunks.push(buf);
  }
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as HookEvent;
  } catch {
    return null;
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
