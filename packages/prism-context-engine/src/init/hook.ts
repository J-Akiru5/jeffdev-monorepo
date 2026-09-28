import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

/** The command `prism init` wires into all three Claude Code hooks
 *  (PreToolUse / PostToolUse / Stop). Uses `npx` rather than a relative
 *  path into this monorepo's own bin/prism.js — the generated file has to
 *  work in any real end-user project that installed @prism-engine/cli,
 *  not just here. */
export const HOOK_COMMAND =
  "npx @prism-engine/cli check --hook --format claude-code";

/** PreToolUse must match every edit tool whose proposed content the engine
 *  can reconstruct (see extractProposedContent in commands/check.ts). */
export const CLAUDE_PRE_MATCHER = "Write|Edit|MultiEdit";
/** PostToolUse keeps the original, demo-verified matcher byte-identical. */
export const CLAUDE_POST_MATCHER = "Write|Edit";

/** Phase 4: per-agent variants of the same command. The engine reads the
 *  agent's own payload shape via --format. */
export const CURSOR_HOOK_COMMAND =
  "npx @prism-engine/cli check --hook --format cursor";
export const ANTIGRAVITY_HOOK_COMMAND =
  "npx @prism-engine/cli check --hook --format antigravity";

export type HookWireOutcome =
  | "created"
  | "merged"
  | "already-present"
  | "invalid-json";

export interface HookWireResult {
  outcome: HookWireOutcome;
  path: string;
}

interface HookEntry {
  type: string;
  command: string;
  [key: string]: unknown;
}

interface HookMatcher {
  matcher?: string;
  hooks?: HookEntry[];
  [key: string]: unknown;
}

interface ClaudeSettings {
  hooks?: {
    PreToolUse?: HookMatcher[];
    PostToolUse?: HookMatcher[];
    Stop?: HookMatcher[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function isPrismCheckHookCommand(command: unknown): boolean {
  return (
    typeof command === "string" &&
    command.includes("prism") &&
    command.includes("check") &&
    command.includes("--hook")
  );
}

function hasPrismHookIn(entries: unknown): boolean {
  if (!Array.isArray(entries)) return false;
  return entries.some(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      Array.isArray((entry as HookMatcher).hooks) &&
      (entry as HookMatcher).hooks!.some((hook) =>
        isPrismCheckHookCommand(hook.command),
      ),
  );
}

/**
 * Wire the Claude Code hooks into `.claude/settings.json`, merging with
 * whatever's already there:
 *   - PreToolUse  (Write|Edit|MultiEdit) — halt a violating write pre-disk
 *   - PostToolUse (Write|Edit)           — original safety net, unchanged
 *   - Stop                               — refuse session end on violations
 * Never overwrites an existing key — only appends the Pass entry for each
 * event that lacks one. Malformed existing JSON is left untouched (returns
 * "invalid-json" so the caller can warn) rather than clobbered. Idempotent:
 * any existing config, including one that only has the original PostToolUse
 * hook, upgrades in place on the next `prism init`.
 */
export function wireClaudeHook(cwd: string): HookWireResult {
  const dir = join(cwd, ".claude");
  const path = join(dir, "settings.json");

  if (!existsSync(path)) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const fresh: ClaudeSettings = {
      hooks: {
        PreToolUse: [
          {
            matcher: CLAUDE_PRE_MATCHER,
            hooks: [{ type: "command", command: HOOK_COMMAND }],
          },
        ],
        PostToolUse: [
          {
            matcher: CLAUDE_POST_MATCHER,
            hooks: [{ type: "command", command: HOOK_COMMAND }],
          },
        ],
        Stop: [{ hooks: [{ type: "command", command: HOOK_COMMAND }] }],
      },
    };
    writeFileSync(path, `${JSON.stringify(fresh, null, 2)}\n`);
    return { outcome: "created", path };
  }

  let settings: ClaudeSettings;
  try {
    settings = JSON.parse(readFileSync(path, "utf8")) as ClaudeSettings;
  } catch {
    return { outcome: "invalid-json", path };
  }

  const hooks = settings.hooks ?? {};
  const pre = Array.isArray(hooks.PreToolUse) ? [...hooks.PreToolUse] : [];
  const post = Array.isArray(hooks.PostToolUse) ? [...hooks.PostToolUse] : [];
  const stop = Array.isArray(hooks.Stop) ? [...hooks.Stop] : [];

  const missingPre = !hasPrismHookIn(pre);
  const missingPost = !hasPrismHookIn(post);
  const missingStop = !hasPrismHookIn(stop);

  if (!missingPre && !missingPost && !missingStop) {
    return { outcome: "already-present", path };
  }

  if (missingPre) {
    pre.push({
      matcher: CLAUDE_PRE_MATCHER,
      hooks: [{ type: "command", command: HOOK_COMMAND }],
    });
  }
  if (missingPost) {
    post.push({
      matcher: CLAUDE_POST_MATCHER,
      hooks: [{ type: "command", command: HOOK_COMMAND }],
    });
  }
  if (missingStop) {
    stop.push({ hooks: [{ type: "command", command: HOOK_COMMAND }] });
  }

  const merged: ClaudeSettings = {
    ...settings,
    hooks: { ...settings.hooks, PreToolUse: pre, PostToolUse: post, Stop: stop },
  };
  writeFileSync(path, `${JSON.stringify(merged, null, 2)}\n`);
  return { outcome: "merged", path };
}

// ---------------------------------------------------------------------------
// Phase 4: Cursor + Antigravity hook wiring.
//
// VERIFICATION STATUS (2026-08-23, honest):
// - Cursor mechanism verified against public docs (hooks.json, afterFileEdit,
//   stdin JSON with top-level file_path, exit 2 = block). END-TO-END FIRING
//   INSIDE CURSOR IS UNVERIFIED on this machine — the IDE is installed but
//   its hook runner could not be exercised headlessly.
// - Antigravity 2.0 verified against official docs (hooks.json with
//   PostToolUse matcher/hooks arrays, camelCase stdin/stdout JSON). Same
//   limitation: config creation verified, in-agent firing not.
// - Claude Desktop has NO hooks system at all — MCP-advisory only, already
//   wired by ide-setup. It is not a formatter target.
// ----------------------------------------------------------------------------

const CURSOR_DIR = join(".cursor");
const ANTIGRAVITY_AGENTS_DIR = join(".agents");

function readJsonIfExists(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function containsCommand(value: unknown, needle: string): boolean {
  if (typeof value === "string") return value.includes(needle);
  if (Array.isArray(value)) return value.some((v) => containsCommand(v, needle));
  if (value && typeof value === "object") {
    return Object.values(value).some((v) => containsCommand(v, needle));
  }
  return false;
}

export type AgentWireOutcome =
  | "created"
  | "merged"
  | "already-present"
  | "invalid-json"
  /** A file at our target path that Prism did not generate — left untouched. */
  | "foreign";

export interface AgentWireResult {
  outcome: AgentWireOutcome;
  path: string;
}

/** Wire the Pass into .cursor/hooks.json as an afterFileEdit command.
 *  NOTE: Cursor can ALSO auto-map .claude/settings.json hooks when
 *  third-party skill mapping is enabled — running both produces duplicate
 *  corrections. Users should pick one surface. */
export function wireCursorHook(cwd: string): AgentWireResult {
  const dir = join(cwd, CURSOR_DIR);
  const path = join(dir, "hooks.json");

  const existing = readJsonIfExists(path);
  if (existing && containsCommand(existing, "--format cursor")) {
    return { outcome: "already-present", path };
  }

  const doc = existing ?? { version: 1, hooks: {} as Record<string, unknown> };
  const hooks = (doc.hooks ?? {}) as Record<string, unknown>;
  const entries = Array.isArray(hooks.afterFileEdit)
    ? (hooks.afterFileEdit as unknown[])
    : [];
  entries.push({ command: CURSOR_HOOK_COMMAND });
  hooks.afterFileEdit = entries;
  doc.hooks = hooks;
  (doc as Record<string, unknown>).version =
    typeof doc.version === "number" ? doc.version : 1;

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
  return { outcome: existing ? "merged" : "created", path };
}

/** Wire the Pass into .agents/hooks.json (Antigravity 2.0 customization
 *  directory) as a PostToolUse handler. Antigravity's schema mirrors Claude
 *  Code's matcher/hooks array shape with camelCase payloads; the engine's
 *  superset parser handles both shapes via --format antigravity. */
export function wireAntigravityHook(cwd: string): AgentWireResult {
  const dir = join(cwd, ANTIGRAVITY_AGENTS_DIR);
  const path = join(dir, "hooks.json");

  const existing = readJsonIfExists(path);
  if (existing && containsCommand(existing, "--format antigravity")) {
    return { outcome: "already-present", path };
  }

  const doc = existing ?? {};
  const prism = (doc["prism-pass"] ?? {}) as Record<string, unknown>;
  const postToolUse = Array.isArray(prism.PostToolUse)
    ? (prism.PostToolUse as unknown[])
    : [];
  postToolUse.push({
    hooks: [{ type: "command", command: ANTIGRAVITY_HOOK_COMMAND }],
  });
  prism.PostToolUse = postToolUse;
  doc["prism-pass"] = prism;

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
  return { outcome: existing ? "merged" : "created", path };
}

// ---------------------------------------------------------------------------
// OpenCode (opencode.ai) wiring — a genuinely separate target.
//
// Unlike Claude Code / Cursor / Antigravity (which register a COMMAND in
// JSON config and key off its exit code), OpenCode loads a plugin FILE and
// blocks by THROWING from tool.execute.before/after. So the target is
// `.opencode/plugin/prism.js` — auto-discovered by OpenCode, no opencode.json
// entry required — generated with its own throw-based handler, parallel to
// (never layered into) the other three wirings.
// ---------------------------------------------------------------------------

export const OPENCODE_PLUGIN_PATH = join(".opencode", "plugin", "prism.js");

/** Idempotence marker: a file containing this line is treated as ours. */
export const OPENCODE_PLUGIN_MARKER = "prism-pass-opencode";

/** Generated plugin source. Fail-open by construction: a missing
 *  @prism-engine/cli install or any runtime error disables enforcement
 *  instead of ever breaking the agent session. A block is the ONLY thing
 *  that throws, and it throws from inside the hook (no exit codes here).
 *
 *  Strict mode (fail-closed): with a `.prism/strict` marker in the
 *  project, an unavailable runtime BLOCKS the gated tools with the fixed
 *  "PRISM NOT ACTIVE" message and a direct `BLOCKED prism-unavailable:`
 *  activity line (appended without the runtime, so it works even when the
 *  import failed). Without the marker, behavior is unchanged. Only a human
 *  removes the marker; the message never says how. */
const OPENCODE_PLUGIN_SOURCE = `// Generated by prism init — the Prism Pass for OpenCode.
// Throw-based dispatch: tool.execute.before/after signal a block by
// THROWING. There is no exit-code contract on this path; every other
// failure fails open (allow) so a missing install or runtime error can
// never break the agent session — UNLESS a .prism/strict marker is present
// (strict mode), where an unavailable engine blocks gated tools instead.
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PLUGIN_ID = "prism-pass-opencode";
const GATED_TOOLS = new Set(["write", "edit", "multiedit", "apply_patch"]);
let runtime = null;
let projectDirectory = null;
let strict = false;

function strictMessage(reason) {
  return (
    "PRISM NOT ACTIVE (fail-closed): " +
    reason +
    ". Stop and tell Jeff. Do not work around this."
  );
}

function logUnavailable(reason, filePath) {
  if (!projectDirectory) return;
  try {
    const dir = join(projectDirectory, ".prism");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const file =
      typeof filePath === "string" && filePath.length > 0 ? filePath : "-";
    appendFileSync(
      join(dir, "activity.log"),
      new Date().toISOString() +
        "\\tpre\\t" +
        file +
        "\\tBLOCKED prism-unavailable:" +
        reason +
        "\\n",
    );
  } catch {
    // Logging must never change the block behavior.
  }
}

function strictBlock(reason, args) {
  const filePath =
    args && typeof args.filePath === "string"
      ? args.filePath
      : args && typeof args.file_path === "string"
        ? args.file_path
        : null;
  logUnavailable(reason, filePath);
  throw new Error(strictMessage(reason));
}

function isGated(tool) {
  return GATED_TOOLS.has(typeof tool === "string" ? tool.toLowerCase() : "");
}

async function evaluate(phase, tool, args) {
  if (!runtime) return null;
  try {
    return await runtime.handleOpenCodeToolEvent(
      phase,
      { tool: tool, args: args || {} },
      { cwd: projectDirectory },
    );
  } catch (err) {
    if (strict && isGated(tool)) {
      strictBlock("handler-error", args);
    }
    console.error(
      "[prism] opencode hook skipped: " +
        (err && err.message ? err.message : String(err)),
    );
    return null;
  }
}

function guard(tool, args) {
  if (strict && !runtime && isGated(tool)) {
    strictBlock("runtime-import-failed", args);
  }
}

export default {
  id: PLUGIN_ID,
  server: async (input) => {
    projectDirectory = input && input.directory ? input.directory : null;
    strict = false;
    if (projectDirectory) {
      try {
        strict = existsSync(join(projectDirectory, ".prism", "strict"));
      } catch {
        strict = false;
      }
    }
    try {
      runtime = await import("@prism-engine/cli/hook-runtime");
    } catch (err) {
      runtime = null;
      console.error(
        "[prism] opencode plugin: @prism-engine/cli not installed — enforcement disabled (fail open)" +
          (strict ? " [strict: gated writes will be blocked]" : ""),
      );
    }
    return {
      "tool.execute.before": async (input, output) => {
        const tool = input && input.tool;
        const args = output && output.args;
        guard(tool, args);
        const outcome = await evaluate("pre", tool, args);
        if (outcome && outcome.status === "block") {
          throw new Error(outcome.message);
        }
      },
      "tool.execute.after": async (input) => {
        const tool = input && input.tool;
        const args = input && input.args;
        guard(tool, args);
        const outcome = await evaluate("post", tool, args);
        if (outcome && outcome.status === "block") {
          throw new Error(outcome.message);
        }
      },
    };
  },
};
`;

/**
 * Write the Prism plugin into `.opencode/plugin/`. Never overwrites a file
 * it didn't generate (returns "foreign" so the caller can warn) and is
 * idempotent against our own output.
 */
export function wireOpenCodeHook(cwd: string): AgentWireResult {
  const path = join(cwd, OPENCODE_PLUGIN_PATH);

  if (existsSync(path)) {
    let content: string;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      return { outcome: "foreign", path };
    }
    if (content.includes(OPENCODE_PLUGIN_MARKER)) {
      return { outcome: "already-present", path };
    }
    return { outcome: "foreign", path };
  }

  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, OPENCODE_PLUGIN_SOURCE);
  return { outcome: "created", path };
}
