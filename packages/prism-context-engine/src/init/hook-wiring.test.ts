import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { pathToFileURL } from "url";
import {
  wireCursorHook,
  wireAntigravityHook,
  wireOpenCodeHook,
  CURSOR_HOOK_COMMAND,
  ANTIGRAVITY_HOOK_COMMAND,
  OPENCODE_PLUGIN_PATH,
  OPENCODE_PLUGIN_MARKER,
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

describe("wireOpenCodeHook", () => {
  let dir: string;
  beforeEach(() => {
    dir = makeTmpDir("opencode");
  });

  it("creates .opencode/plugin/prism.js with the throw-based dispatch", () => {
    const result = wireOpenCodeHook(dir);
    expect(result.outcome).toBe("created");
    expect(result.path).toBe(join(dir, OPENCODE_PLUGIN_PATH));

    const source = readFileSync(result.path, "utf8");
    expect(source).toContain(OPENCODE_PLUGIN_MARKER);
    expect(source).toContain('const PLUGIN_ID = "prism-pass-opencode"');
    expect(source).toContain('"tool.execute.before"');
    expect(source).toContain('"tool.execute.after"');
    expect(source).toContain("throw new Error(outcome.message)");
    expect(source).toContain("@prism-engine/cli/hook-runtime");
    // Separate surfaces: wiring OpenCode touches nothing Claude/Cursor owns.
    expect(existsSync(join(dir, ".claude"))).toBe(false);
    expect(existsSync(join(dir, ".cursor"))).toBe(false);
  });

  it("is idempotent and never rewrites its own output", () => {
    const first = wireOpenCodeHook(dir);
    const before = readFileSync(first.path, "utf8");
    const second = wireOpenCodeHook(dir);
    expect(second.outcome).toBe("already-present");
    expect(readFileSync(first.path, "utf8")).toBe(before);
  });

  it("leaves a foreign plugin file untouched", () => {
    const path = join(dir, OPENCODE_PLUGIN_PATH);
    mkdirSync(join(dir, ".opencode", "plugin"), { recursive: true });
    const foreign = "export default { id: 'not-ours', server: async () => ({}) };\n";
    writeFileSync(path, foreign);

    const result = wireOpenCodeHook(dir);
    expect(result.outcome).toBe("foreign");
    expect(readFileSync(path, "utf8")).toBe(foreign);
  });

  it("writes a valid ESM module that registers both hooks and fails open when the CLI isn't installed", async () => {
    const result = wireOpenCodeHook(dir);
    const mod = (await import(pathToFileURL(result.path).href)) as {
      default: {
        id: string;
        server: (input: {
          directory: string;
        }) => Promise<Record<string, (input: unknown, output?: unknown) => Promise<void>>>;
      };
    };

    expect(mod.default.id).toBe("prism-pass-opencode");
    expect(typeof mod.default.server).toBe("function");

    // @prism-engine/cli is not installed under the temp dir — server()
    // must still return both hooks (fail open, never throw).
    const hooks = await mod.default.server({ directory: dir });
    expect(typeof hooks["tool.execute.before"]).toBe("function");
    expect(typeof hooks["tool.execute.after"]).toBe("function");

    // Without the runtime, a before-call must NOT throw (allow path).
    await expect(
      hooks["tool.execute.before"]({ tool: "write" }, { args: {} }),
    ).resolves.toBeUndefined();
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
