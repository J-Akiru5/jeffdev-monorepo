import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

vi.mock("../commands/check.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../commands/check.js")>();
  return {
    ...actual,
    collectBlockingFindings: vi.fn(async () => {
      throw new Error("engine exploded");
    }),
  };
});

import { handleOpenCodeToolEvent } from "./opencode.js";

const RULE_SET = {
  version: 1,
  rules: [
    {
      id: "no-console-log",
      category: "styling",
      severity: "block",
      extensions: [".ts"],
      instruction: "No console.log in shipped TypeScript.",
      check: {
        type: "forbidden_pattern",
        pattern: "console\\.log",
        fix: "remove console.log",
        message: "console.log is forbidden",
      },
    },
  ],
};

const MESSAGE =
  "PRISM NOT ACTIVE (fail-closed): engine-error. Stop and tell Jeff. Do not work around this.";

const dirs: string[] = [];

function makeProject(label: string, strict: boolean): string {
  const dir = join(
    tmpdir(),
    `prism-strict-engine-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(join(dir, ".prism"), { recursive: true });
  if (strict) writeFileSync(join(dir, ".prism", "strict"), "");
  writeFileSync(
    join(dir, ".prism", "rules.json"),
    `${JSON.stringify(RULE_SET, null, 2)}\n`,
  );
  dirs.push(dir);
  return dir;
}

function activityLines(dir: string): string[] {
  const logPath = join(dir, ".prism", "activity.log");
  if (!existsSync(logPath)) return [];
  return readFileSync(logPath, "utf8").split("\n").filter(Boolean);
}

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("GOOGLE_GEMINI_API_KEY", "");
  vi.stubEnv("PRISM_DISABLE", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("strict mode: engine error", () => {
  it("blocks a gated write with engine-error and logs the line", async () => {
    const dir = makeProject("strict", true);
    const outcome = await handleOpenCodeToolEvent(
      "pre",
      { tool: "write", args: { filePath: join(dir, "src", "a.ts"), content: "const a = 1;" } },
      { cwd: dir },
    );

    expect(outcome.status).toBe("block");
    expect(outcome.message).toBe(MESSAGE);
    expect(outcome.activityResult).toBe("BLOCKED prism-unavailable:engine-error");
    const lines = activityLines(dir);
    expect(lines[lines.length - 1]).toMatch(
      /\tpre\t.*\tBLOCKED prism-unavailable:engine-error$/,
    );
  });

  it("stays fail-open without the marker (SKIPPED engine-error)", async () => {
    const dir = makeProject("plain", false);
    const outcome = await handleOpenCodeToolEvent(
      "pre",
      { tool: "write", args: { filePath: join(dir, "src", "a.ts"), content: "const a = 1;" } },
      { cwd: dir },
    );

    expect(outcome.status).toBe("allow");
    expect(outcome.activityResult).toBe("SKIPPED engine-error");
    expect(activityLines(dir).some((l) => l.includes("prism-unavailable"))).toBe(false);
  });
});
