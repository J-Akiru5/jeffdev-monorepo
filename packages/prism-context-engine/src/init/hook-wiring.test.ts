import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  wireCursorHook,
  wireAntigravityHook,
  CURSOR_HOOK_COMMAND,
  ANTIGRAVITY_HOOK_COMMAND,
} from "./hook.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-agent-wire-${label}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("wireCursorHook", () => {
  let dir: string;
  beforeEach(() => {
    dir = makeTmpDir("cursor");
  });

  it("creates .cursor/hooks.json when nothing exists", () => {
    const result = wireCursorHook(dir);
    expect(result.outcome).toBe("created");
    const doc = JSON.parse(
      readFileSync(join(dir, ".cursor", "hooks.json"), "utf8"),
    );
    expect(doc.version).toBe(1);
    expect(doc.hooks.afterFileEdit).toHaveLength(1);
    expect(doc.hooks.afterFileEdit[0].command).toBe(CURSOR_HOOK_COMMAND);
    expect(CURSOR_HOOK_COMMAND).toContain("--format cursor");
  });

  it("merges into an existing hooks config without dropping other events", () => {
    const cursorDir = join(dir, ".cursor");
    mkdirSync(cursorDir, { recursive: true });
    writeFileSync(
      join(cursorDir, "hooks.json"),
      JSON.stringify({
        version: 1,
        hooks: {
          afterFileEdit: [{ command: "./my-formatter.sh" }],
          beforeShellExecution: [{ command: "./audit.sh" }],
        },
      }),
    );

    const result = wireCursorHook(dir);
    expect(result.outcome).toBe("merged");
    const doc = JSON.parse(
      readFileSync(join(cursorDir, "hooks.json"), "utf8"),
    );
    // Other events and other commands preserved; ours appended.
    expect(doc.hooks.beforeShellExecution).toHaveLength(1);
    expect(doc.hooks.afterFileEdit).toHaveLength(2);
    expect(doc.hooks.afterFileEdit[0].command).toBe("./my-formatter.sh");
  });

  it("is idempotent — never duplicates the prism entry", () => {
    const first = wireCursorHook(dir);
    const second = wireCursorHook(dir);
    expect(first.outcome).toBe("created");
    expect(second.outcome).toBe("already-present");
    const doc = JSON.parse(
      readFileSync(join(dir, ".cursor", "hooks.json"), "utf8"),
    );
    expect(doc.hooks.afterFileEdit).toHaveLength(1);
  });
});

describe("wireAntigravityHook", () => {
  let dir: string;
  beforeEach(() => {
    dir = makeTmpDir("antigravity");
  });

  it("creates .agents/hooks.json with a PostToolUse handler", () => {
    const result = wireAntigravityHook(dir);
    expect(result.outcome).toBe("created");
    const doc = JSON.parse(
      readFileSync(join(dir, ".agents", "hooks.json"), "utf8"),
    );
    const handlers = doc["prism-pass"].PostToolUse;
    expect(handlers).toHaveLength(1);
    expect(handlers[0].hooks[0].command).toBe(ANTIGRAVITY_HOOK_COMMAND);
    expect(ANTIGRAVITY_HOOK_COMMAND).toContain("--format antigravity");
  });

  it("preserves unrelated hook names when merging", () => {
    const agentsDir = join(dir, ".agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(agentsDir, "hooks.json"),
      JSON.stringify({
        "my-linter": {
          PostToolUse: [
            { hooks: [{ type: "command", command: "./lint.sh" }] },
          ],
        },
      }),
    );

    wireAntigravityHook(dir);
    const doc = JSON.parse(
      readFileSync(join(agentsDir, "hooks.json"), "utf8"),
    );
    expect(doc["my-linter"].PostToolUse).toHaveLength(1);
    expect(doc["prism-pass"].PostToolUse).toHaveLength(1);
  });

  it("is idempotent", () => {
    wireAntigravityHook(dir);
    const second = wireAntigravityHook(dir);
    expect(second.outcome).toBe("already-present");
    const doc = JSON.parse(
      readFileSync(join(dir, ".agents", "hooks.json"), "utf8"),
    );
    expect(doc["prism-pass"].PostToolUse).toHaveLength(1);
  });
});

describe("claude-code contract untouched (regression)", () => {
  it("still wires .claude/settings.json with the original command shape", async () => {
    const { wireClaudeHook, HOOK_COMMAND } = await import("./hook.js");
    const dir = makeTmpDir("claude-regression");
    const result = wireClaudeHook(dir);
    expect(result.outcome).toBe("created");
    const settings = JSON.parse(
      readFileSync(join(dir, ".claude", "settings.json"), "utf8"),
    );
    expect(settings.hooks.PostToolUse[0].hooks[0].command).toBe(HOOK_COMMAND);
    expect(HOOK_COMMAND).toBe(
      "npx @prism-engine/cli check --hook --format claude-code",
    );
    expect(existsSync(join(dir, ".cursor"))).toBe(false); // separate surfaces
  });
});
