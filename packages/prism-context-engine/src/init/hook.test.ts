import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { wireClaudeHook, HOOK_COMMAND } from "./hook.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-hook-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("wireClaudeHook", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("creates .claude/settings.json when none exists", () => {
    const dir = makeTmpDir("create");
    dirs.push(dir);
    const result = wireClaudeHook(dir);
    expect(result.outcome).toBe("created");
    const settings = JSON.parse(readFileSync(result.path, "utf8"));
    expect(settings.hooks.PostToolUse[0].hooks[0].command).toBe(HOOK_COMMAND);
  });

  it("merges into an existing settings.json without touching unrelated keys", () => {
    const dir = makeTmpDir("merge");
    dirs.push(dir);
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(
      join(dir, ".claude", "settings.json"),
      JSON.stringify({
        permissions: { allow: ["Bash(git *)"] },
        hooks: {
          PostToolUse: [
            { matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] },
          ],
        },
      }),
    );

    const result = wireClaudeHook(dir);
    expect(result.outcome).toBe("merged");
    const settings = JSON.parse(readFileSync(result.path, "utf8"));
    // existing unrelated key preserved
    expect(settings.permissions.allow).toEqual(["Bash(git *)"]);
    // existing matcher preserved
    expect(settings.hooks.PostToolUse).toHaveLength(2);
    expect(
      settings.hooks.PostToolUse.some(
        (m: { matcher: string }) => m.matcher === "Bash",
      ),
    ).toBe(true);
    // new prism hook added
    expect(
      settings.hooks.PostToolUse.some((m: { hooks: { command: string }[] }) =>
        m.hooks.some((h) => h.command === HOOK_COMMAND),
      ),
    ).toBe(true);
  });

  it("is idempotent — running twice doesn't duplicate the hook entry", () => {
    const dir = makeTmpDir("idempotent");
    dirs.push(dir);
    wireClaudeHook(dir);
    const second = wireClaudeHook(dir);
    expect(second.outcome).toBe("already-present");
    const settings = JSON.parse(
      readFileSync(join(dir, ".claude", "settings.json"), "utf8"),
    );
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });

  it("leaves malformed existing JSON untouched", () => {
    const dir = makeTmpDir("invalid");
    dirs.push(dir);
    mkdirSync(join(dir, ".claude"), { recursive: true });
    const path = join(dir, ".claude", "settings.json");
    writeFileSync(path, "{ not valid json");

    const result = wireClaudeHook(dir);
    expect(result.outcome).toBe("invalid-json");
    expect(readFileSync(path, "utf8")).toBe("{ not valid json");
  });
});

describe("three-hook wiring (PreToolUse + PostToolUse + Stop)", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("creates all three hooks with the shared command", () => {
    const dir = makeTmpDir("three-create");
    dirs.push(dir);
    const result = wireClaudeHook(dir);
    expect(result.outcome).toBe("created");
    const settings = JSON.parse(readFileSync(result.path, "utf8"));
    expect(settings.hooks.PreToolUse[0].matcher).toBe("Write|Edit|MultiEdit");
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe(HOOK_COMMAND);
    expect(settings.hooks.PostToolUse[0].matcher).toBe("Write|Edit");
    expect(settings.hooks.PostToolUse[0].hooks[0].command).toBe(HOOK_COMMAND);
    expect(settings.hooks.Stop[0].hooks[0].command).toBe(HOOK_COMMAND);
  });

  it("upgrades a PostToolUse-only config in place (adds Pre + Stop)", () => {
    const dir = makeTmpDir("three-upgrade");
    dirs.push(dir);
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(
      join(dir, ".claude", "settings.json"),
      JSON.stringify({
        hooks: {
          PostToolUse: [
            {
              matcher: "Write|Edit",
              hooks: [{ type: "command", command: HOOK_COMMAND }],
            },
          ],
        },
      }),
    );

    const result = wireClaudeHook(dir);
    expect(result.outcome).toBe("merged");
    const settings = JSON.parse(readFileSync(result.path, "utf8"));
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.PreToolUse).toHaveLength(1);
    expect(settings.hooks.Stop).toHaveLength(1);
  });

  it("is idempotent across all three hook keys", () => {
    const dir = makeTmpDir("three-idempotent");
    dirs.push(dir);
    wireClaudeHook(dir);
    const second = wireClaudeHook(dir);
    expect(second.outcome).toBe("already-present");
    const settings = JSON.parse(readFileSync(second.path, "utf8"));
    expect(settings.hooks.PreToolUse).toHaveLength(1);
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.Stop).toHaveLength(1);
  });
});
