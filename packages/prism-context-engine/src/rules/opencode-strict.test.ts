import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
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

const MESSAGE = (reason: string) =>
  `PRISM NOT ACTIVE (fail-closed): ${reason}. Stop and tell Jeff. Do not work around this.`;

const dirs: string[] = [];

function makeProject(label: string, opts: { strict: boolean; rules: "valid" | "missing" | "invalid" | "empty" }): string {
  const dir = join(
    tmpdir(),
    `prism-strict-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(join(dir, ".prism"), { recursive: true });
  if (opts.strict) {
    writeFileSync(join(dir, ".prism", "strict"), "");
  }
  if (opts.rules === "valid") {
    writeFileSync(
      join(dir, ".prism", "rules.json"),
      `${JSON.stringify(RULE_SET, null, 2)}\n`,
    );
  } else if (opts.rules === "invalid") {
    writeFileSync(join(dir, ".prism", "rules.json"), "{ not valid json\n");
  } else if (opts.rules === "empty") {
    writeFileSync(
      join(dir, ".prism", "rules.json"),
      `${JSON.stringify({ version: 1, rules: [] }, null, 2)}\n`,
    );
  }
  dirs.push(dir);
  return dir;
}

function activityLines(dir: string): string[] {
  const logPath = join(dir, ".prism", "activity.log");
  if (!existsSync(logPath)) return [];
  return readFileSync(logPath, "utf8").split("\n").filter(Boolean);
}

const writeCall = (dir: string, tool = "write") => ({
  tool,
  args: { filePath: join(dir, "src", "a.ts"), content: "const a = 1;" },
});

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

describe("strict mode: rules.json missing", () => {
  it("blocks a gated write with the fixed message and logs prism-unavailable", async () => {
    const dir = makeProject("missing", { strict: true, rules: "missing" });
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("block");
    expect(outcome.message).toBe(MESSAGE("rules-missing"));
    expect(outcome.activityResult).toBe("BLOCKED prism-unavailable:rules-missing");
    const lines = activityLines(dir);
    expect(lines[lines.length - 1]).toMatch(
      /\tpre\t.*\tBLOCKED prism-unavailable:rules-missing$/,
    );
  });

  it("stays fail-open without the marker", async () => {
    const dir = makeProject("missing-plain", { strict: false, rules: "missing" });
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("allow");
    expect(outcome.activityResult).toBe("SKIPPED no-rules");
    expect(activityLines(dir).some((l) => l.includes("prism-unavailable"))).toBe(false);
  });
});

describe("strict mode: rules.json invalid", () => {
  it("blocks a gated write with rules-invalid and logs the line", async () => {
    const dir = makeProject("invalid", { strict: true, rules: "invalid" });
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("block");
    expect(outcome.message).toBe(MESSAGE("rules-invalid"));
    expect(outcome.activityResult).toBe("BLOCKED prism-unavailable:rules-invalid");
    const lines = activityLines(dir);
    expect(lines[lines.length - 1]).toMatch(
      /\tpre\t.*\tBLOCKED prism-unavailable:rules-invalid$/,
    );
  });

  it("stays fail-open without the marker", async () => {
    const dir = makeProject("invalid-plain", { strict: false, rules: "invalid" });
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("allow");
    expect(activityLines(dir).some((l) => l.includes("prism-unavailable"))).toBe(false);
  });
});

describe("strict mode: rules.json empty", () => {
  it("blocks a gated write with rules-empty and logs the line", async () => {
    const dir = makeProject("empty", { strict: true, rules: "empty" });
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("block");
    expect(outcome.message).toBe(MESSAGE("rules-empty"));
    expect(outcome.activityResult).toBe("BLOCKED prism-unavailable:rules-empty");
    const lines = activityLines(dir);
    expect(lines[lines.length - 1]).toMatch(
      /\tpre\t.*\tBLOCKED prism-unavailable:rules-empty$/,
    );
  });

  it("stays fail-open without the marker", async () => {
    const dir = makeProject("empty-plain", { strict: false, rules: "empty" });
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("allow");
    expect(outcome.activityResult).toBe("SKIPPED not-applicable");
  });
});

describe("strict mode: PRISM_DISABLE", () => {
  it("blocks a gated write with prism-disable and logs the line", async () => {
    const dir = makeProject("disable", { strict: true, rules: "valid" });
    vi.stubEnv("PRISM_DISABLE", "1");
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("block");
    expect(outcome.message).toBe(MESSAGE("prism-disable"));
    expect(outcome.activityResult).toBe("BLOCKED prism-unavailable:prism-disable");
    const lines = activityLines(dir);
    expect(lines[lines.length - 1]).toMatch(
      /\tpre\t.*\tBLOCKED prism-unavailable:prism-disable$/,
    );
  });

  it("stays fail-open without the marker", async () => {
    const dir = makeProject("disable-plain", { strict: false, rules: "valid" });
    vi.stubEnv("PRISM_DISABLE", "1");
    const outcome = await handleOpenCodeToolEvent("pre", writeCall(dir), { cwd: dir });

    expect(outcome.status).toBe("allow");
    expect(activityLines(dir).length).toBe(0);
  });
});

describe("strict mode: non-gated tools are unaffected", () => {
  it("allows a bash call even with strict + no rules", async () => {
    const dir = makeProject("bash", { strict: true, rules: "missing" });
    const outcome = await handleOpenCodeToolEvent(
      "pre",
      { tool: "bash", args: { command: "echo hi" } },
      { cwd: dir },
    );

    expect(outcome.status).toBe("allow");
    expect(activityLines(dir).length).toBe(0);
  });
});
