import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/** The command `prism init` wires into .claude/settings.json's PostToolUse
 *  hook. Uses `npx` rather than a relative path into this monorepo's own
 *  bin/prism.js — the generated file has to work in any real end-user
 *  project that installed @prism-engine/cli, not just here. */
export const HOOK_COMMAND =
  "npx @prism-engine/cli check --hook --format claude-code";

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
    PostToolUse?: HookMatcher[];
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

function hasPrismHook(settings: ClaudeSettings): boolean {
  const postToolUse = settings.hooks?.PostToolUse;
  if (!Array.isArray(postToolUse)) return false;
  return postToolUse.some(
    (entry) =>
      Array.isArray(entry.hooks) &&
      entry.hooks.some((hook) => isPrismCheckHookCommand(hook.command)),
  );
}

/**
 * Wire the Claude Code PostToolUse hook into `.claude/settings.json`,
 * merging with whatever's already there. Never overwrites an existing
 * key — only adds a PostToolUse matcher entry for the Pass, and only if
 * one isn't already present. Malformed existing JSON is left untouched
 * (returns "invalid-json" so the caller can warn) rather than clobbered.
 */
export function wireClaudeHook(cwd: string): HookWireResult {
  const dir = join(cwd, ".claude");
  const path = join(dir, "settings.json");

  if (!existsSync(path)) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const fresh: ClaudeSettings = {
      hooks: {
        PostToolUse: [
          { matcher: "Write|Edit", hooks: [{ type: "command", command: HOOK_COMMAND }] },
        ],
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

  if (hasPrismHook(settings)) {
    return { outcome: "already-present", path };
  }

  const postToolUse = Array.isArray(settings.hooks?.PostToolUse)
    ? [...settings.hooks!.PostToolUse!]
    : [];
  postToolUse.push({
    matcher: "Write|Edit",
    hooks: [{ type: "command", command: HOOK_COMMAND }],
  });
  const merged: ClaudeSettings = {
    ...settings,
    hooks: { ...settings.hooks, PostToolUse: postToolUse },
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
  | "invalid-json";

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
