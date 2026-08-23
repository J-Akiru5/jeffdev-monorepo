import { describe, it, expect, afterEach, vi } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseRuleSet } from "../rules/parse.js";

const promptYesNoMock = vi.fn();
vi.mock("../util/prompt.js", () => ({
  promptYesNo: (...args: unknown[]) => promptYesNoMock(...args),
  promptText: vi.fn(),
}));

// Imported after the mock declaration; vitest hoists vi.mock() above this,
// so init.ts's `import { promptYesNo } from "../util/prompt.js"` resolves
// to the mock at module-load time either way — this ordering just keeps
// the file readable top-to-bottom.
const { init } = await import("./init.js");

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-init-cmd-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

function rulesPath(dir: string): string {
  return join(dir, ".prism", "rules.json");
}

describe("prism init (local onboarding)", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
    promptYesNoMock.mockReset();
  });

  it("handles the empty case: writes a valid, advisory-only starter and wires the hook", async () => {
    const dir = makeTmpDir("empty");
    dirs.push(dir);

    await init({ cwd: dir, yes: true });

    expect(existsSync(rulesPath(dir))).toBe(true);
    const ruleSet = JSON.parse(readFileSync(rulesPath(dir), "utf8"));
    expect(() => parseRuleSet(JSON.stringify(ruleSet))).not.toThrow();
    expect(ruleSet.rules.every((r: { check?: unknown }) => !r.check)).toBe(true);
    expect(existsSync(join(dir, ".claude", "settings.json"))).toBe(true);
  });

  it("generates real, valid enforceable rules from a Next.js + Tailwind + globals.css project", async () => {
    const dir = makeTmpDir("real-project");
    dirs.push(dir);
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        dependencies: { next: "15.1.0" },
        devDependencies: { tailwindcss: "3.4.1" },
      }),
    );
    mkdirSync(join(dir, "app"), { recursive: true });
    writeFileSync(
      join(dir, "app", "globals.css"),
      `:root {\n  --brand-primary: #06b6d4;\n}\n`,
    );

    await init({ cwd: dir, yes: true });

    const ruleSet = JSON.parse(readFileSync(rulesPath(dir), "utf8"));
    expect(() => parseRuleSet(JSON.stringify(ruleSet))).not.toThrow();
    const ids = ruleSet.rules.map((r: { id: string }) => r.id);
    expect(ids).toContain("styling/design-tokens");
    expect(ids).toContain("styling/no-arbitrary-tailwind-values");
    // Regression (2026-08-24 E2E): the token rule must block (warns are
    // invisible to the agent in hook mode) and must not apply to .css
    // (the tokens' own definition lines would self-flag).
    const tokenRule = ruleSet.rules.find(
      (r: { id: string }) => r.id === "styling/design-tokens",
    );
    expect(tokenRule.severity).toBe("block");
    expect(tokenRule.extensions).not.toContain(".css");
  });

  it("merges the hook into an existing .claude/settings.json without dropping other keys", async () => {
    const dir = makeTmpDir("merge-settings");
    dirs.push(dir);
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(
      join(dir, ".claude", "settings.json"),
      JSON.stringify({ permissions: { allow: ["Bash(git *)"] } }),
    );

    await init({ cwd: dir, yes: true });

    const settings = JSON.parse(
      readFileSync(join(dir, ".claude", "settings.json"), "utf8"),
    );
    expect(settings.permissions.allow).toEqual(["Bash(git *)"]);
    expect(settings.hooks.PostToolUse.length).toBeGreaterThan(0);
  });

  it("--yes leaves an existing .prism/rules.json untouched (never silently overwrites)", async () => {
    const dir = makeTmpDir("yes-no-overwrite");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(rulesPath(dir), "EXISTING");

    await init({ cwd: dir, yes: true });

    expect(readFileSync(rulesPath(dir), "utf8")).toBe("EXISTING");
    expect(promptYesNoMock).not.toHaveBeenCalled();
  });

  it("--force overwrites an existing .prism/rules.json without prompting", async () => {
    const dir = makeTmpDir("force-overwrite");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(rulesPath(dir), "EXISTING");

    await init({ cwd: dir, force: true });

    expect(readFileSync(rulesPath(dir), "utf8")).not.toBe("EXISTING");
    expect(promptYesNoMock).not.toHaveBeenCalled();
    expect(() => parseRuleSet(readFileSync(rulesPath(dir), "utf8"))).not.toThrow();
  });

  it("without --yes/--force, prompts and honors a declined overwrite", async () => {
    const dir = makeTmpDir("prompt-decline");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(rulesPath(dir), "EXISTING");
    promptYesNoMock.mockResolvedValue(false);

    await init({ cwd: dir });

    expect(promptYesNoMock).toHaveBeenCalled();
    expect(readFileSync(rulesPath(dir), "utf8")).toBe("EXISTING");
  });

  it("without --yes/--force, prompts and honors an accepted overwrite", async () => {
    const dir = makeTmpDir("prompt-accept");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(rulesPath(dir), "EXISTING");
    promptYesNoMock.mockResolvedValue(true);

    await init({ cwd: dir });

    expect(readFileSync(rulesPath(dir), "utf8")).not.toBe("EXISTING");
  });
});
