import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/** The command `prism init` wires into .claude/settings.json's PostToolUse
 *  hook. Uses `npx` rather than a relative path into this monorepo's own
 *  bin/prism.js — the generated file has to work in any real end-user
 *  project that installed @prism-engine/cli, not just here. */
export const HOOK_COMMAND =
  "npx @prism-engine/cli check --hook --format claude-code";

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
