import { describe, it, expect, afterEach } from "vitest";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { wireOpenCodeHook, OPENCODE_PLUGIN_PATH } from "./hook.js";

const dirs: string[] = [];

function makeProject(label: string, strict: boolean): string {
  const dir = join(
    tmpdir(),
    `prism-plugin-strict-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(join(dir, ".prism"), { recursive: true });
  // ESM for the generated .js files in this scratch project.
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "scratch", private: true, type: "module" }, null, 2)}\n`,
  );
  if (strict) writeFileSync(join(dir, ".prism", "strict"), "");
  // Plant a broken @prism-engine/cli so the plugin's runtime import fails
  // deterministically (the exact incident class strict mode exists for).
  const pkgDir = join(dir, "node_modules", "@prism-engine", "cli");
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(
    join(pkgDir, "package.json"),
    `${JSON.stringify({ name: "@prism-engine/cli", version: "0.0.0", exports: {} }, null, 2)}\n`,
  );
  dirs.push(dir);
  return dir;
}

function activityLines(dir: string): string[] {
  const logPath = join(dir, ".prism", "activity.log");
  if (!existsSync(logPath)) return [];
  return readFileSync(logPath, "utf8").split("\n").filter(Boolean);
}

/** Load the generated plugin in a real node process (no test-runner VM):
 *  calls server(), then one gated or non-gated tool hook, and reports the
 *  outcome on stdout. */
function runPlugin(dir: string, tool: "write" | "bash"): string {
  wireOpenCodeHook(dir);
  const runner = join(dir, "run-plugin.mjs");
  writeFileSync(
    runner,
    `import { pathToFileURL } from "node:url";
const pluginPath = process.argv[2];
const directory = process.argv[3];
const tool = process.argv[4];
const mod = await import(pathToFileURL(pluginPath).href);
const hooks = await mod.default.server({ directory });
try {
  if (tool === "bash") {
    await hooks["tool.execute.before"]({ tool: "bash" }, { args: { command: "echo hi" } });
  } else {
    await hooks["tool.execute.before"](
      { tool: "write" },
      { args: { filePath: "canary.tsx", content: "export default 1;" } },
    );
  }
  console.log("ALLOWED");
} catch (err) {
  console.log("BLOCKED:" + (err && err.message ? err.message : String(err)));
}
`,
  );
  const out = execFileSync(
    process.execPath,
    [runner, join(dir, OPENCODE_PLUGIN_PATH), dir, tool],
    { encoding: "utf8" },
  );
  return out.trim();
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("generated plugin source", () => {
  it("carries the strict guard and never tells the agent how to disable it", () => {
    const dir = makeProject("source", false);
    wireOpenCodeHook(dir);
    const source = readFileSync(join(dir, OPENCODE_PLUGIN_PATH), "utf8");

    expect(source).toContain("PRISM NOT ACTIVE (fail-closed):");
    expect(source).toContain("BLOCKED prism-unavailable:");
    expect(source).toContain('new Set(["write", "edit", "multiedit", "apply_patch"])');
    expect(source).toContain('"strict"');
    expect(source).not.toMatch(/remove|delete|unset/i);
  });
});

describe("strict plugin: runtime import fails", () => {
  it("blocks a gated write with the fixed message and logs the line", () => {
    const dir = makeProject("strict", true);
    const out = runPlugin(dir, "write");

    expect(out).toBe(
      "BLOCKED:PRISM NOT ACTIVE (fail-closed): runtime-import-failed. Stop and tell Jeff. Do not work around this.",
    );
    const lines = activityLines(dir);
    expect(lines[lines.length - 1]).toMatch(
      /\tpre\t.*\tBLOCKED prism-unavailable:runtime-import-failed$/,
    );
  });

  it("leaves non-gated tools alone", () => {
    const dir = makeProject("strict-bash", true);
    const out = runPlugin(dir, "bash");

    expect(out).toBe("ALLOWED");
    expect(activityLines(dir).length).toBe(0);
  });

  it("stays fail-open without the marker", () => {
    const dir = makeProject("plain", false);
    const out = runPlugin(dir, "write");

    expect(out).toBe("ALLOWED");
    expect(activityLines(dir).length).toBe(0);
  });
});
