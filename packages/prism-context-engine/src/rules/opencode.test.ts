import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  handleOpenCodeToolEvent,
  parseApplyPatchSections,
  toHookEvent,
} from "./opencode.js";

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

const dirs: string[] = [];

function makeProject(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-opencode-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(join(dir, ".prism"), { recursive: true });
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
  // Determinism: with no Gemini key the semantic layer reports
  // semanticEnabled() === false, so a regex-clean file resolves to
  // exactly "CLEAN" with no network call.
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

describe("toHookEvent", () => {
  it("maps OpenCode write args to the snake_case hook shape", () => {
    const event = toHookEvent({
      tool: "write",
      args: { filePath: "src/a.ts", content: "const a = 1;" },
    });
    expect(event).toEqual({
      tool_name: "write",
      tool_input: { file_path: "src/a.ts", content: "const a = 1;" },
    });
  });

  it("maps OpenCode edit args (oldString/newString/replaceAll)", () => {
    const event = toHookEvent({
      tool: "edit",
      args: {
        filePath: "src/a.ts",
        oldString: "a",
        newString: "b",
        replaceAll: true,
      },
    });
    expect(event).toEqual({
      tool_name: "edit",
      tool_input: {
        file_path: "src/a.ts",
        old_string: "a",
        new_string: "b",
        replace_all: true,
      },
    });
  });

  it("returns null for non-gated tools (bash)", () => {
    expect(
      toHookEvent({ tool: "bash", args: { command: "Set-Content a.ts" } }),
    ).toBeNull();
  });
});

describe("parseApplyPatchSections", () => {
  it("splits sections and keeps only added (+) lines as content", () => {
    const sections = parseApplyPatchSections(
      [
        "*** Begin Patch",
        "*** Update File: src/a.ts",
        "@@",
        "-const old = 1;",
        "+const neu = 1;",
        " const ctx = 2;",
        "*** Add File: src/b.ts",
        "+export const b = 1;",
        "*** End Patch",
      ].join("\n"),
    );
    expect(sections).toEqual([
      { path: "src/a.ts", added: ["const neu = 1;"] },
      { path: "src/b.ts", added: ["export const b = 1;"] },
    ]);
  });

  it("returns no sections for unparseable payloads", () => {
    expect(parseApplyPatchSections("random text")).toEqual([]);
  });
});

describe("handleOpenCodeToolEvent — throw path", () => {
  it("pre write: blocks a violation with the OpenCode lead line and logs BLOCKED", async () => {
    const dir = makeProject("write-block");
    const filePath = join(dir, "src", "app.ts");
    const out = await handleOpenCodeToolEvent("pre", {
      tool: "write",
      args: { filePath, content: "console.log('x');" },
    });

    expect(out.status).toBe("block");
    expect(out.message).toMatch(
      /^PRISM \(OpenCode\) flagged 1 violation in app\.ts — apply these fixes now:/,
    );
    expect(out.message).toContain("no-console-log");
    expect(out.activityResult).toBe("BLOCKED no-console-log");

    const [line] = activityLines(dir);
    const [ts, phase, file, result] = line.split("\t");
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(phase).toBe("pre");
    expect(file).toBe(filePath);
    expect(result).toBe("BLOCKED no-console-log");
  });

  it("pre write: allows a clean file and logs CLEAN", async () => {
    const dir = makeProject("write-clean");
    const filePath = join(dir, "src", "app.ts");
    const out = await handleOpenCodeToolEvent("pre", {
      tool: "write",
      args: { filePath, content: "export const ok = 1;" },
    });

    expect(out.status).toBe("allow");
    expect(out.message).toBeUndefined();
    expect(out.activityResult).toBe("CLEAN");
    expect(activityLines(dir)[0]).toContain("\tCLEAN");
  });

  it("pre edit: applies oldString→newString against the current file and blocks", async () => {
    const dir = makeProject("edit-block");
    const filePath = join(dir, "src", "app.ts");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(filePath, "const a = 1;\n");

    const out = await handleOpenCodeToolEvent("pre", {
      tool: "edit",
      args: { filePath, oldString: "const a = 1;", newString: "console.log(1);" },
    });

    expect(out.status).toBe("block");
    expect(out.activityResult).toBe("BLOCKED no-console-log");
    expect(activityLines(dir)[0].split("\t")[1]).toBe("pre");
  });

  it("pre edit: old_string not on disk fails open with a logged skip", async () => {
    const dir = makeProject("edit-not-found");
    const filePath = join(dir, "src", "app.ts");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(filePath, "const a = 1;\n");

    const out = await handleOpenCodeToolEvent("pre", {
      tool: "edit",
      args: {
        filePath,
        oldString: "no such text",
        newString: "console.log(1);",
      },
    });

    expect(out.status).toBe("allow");
    expect(out.activityResult).toBe("SKIPPED old-string-not-found");
    expect(activityLines(dir)[0]).toContain("\tSKIPPED old-string-not-found");
  });

  it("bash is not gated: allowed, nothing logged, no activity file", async () => {
    const dir = makeProject("bash-ungated");
    const out = await handleOpenCodeToolEvent("pre", {
      tool: "bash",
      args: { command: "Set-Content app.ts -Value console.log('x')" },
    });

    expect(out.status).toBe("allow");
    expect(out.activityResult).toBeNull();
    expect(existsSync(join(dir, ".prism", "activity.log"))).toBe(false);
  });

  it("PRISM_DISABLE=1 fails open and logs nothing", async () => {
    const dir = makeProject("disabled");
    vi.stubEnv("PRISM_DISABLE", "1");
    const out = await handleOpenCodeToolEvent("pre", {
      tool: "write",
      args: {
        filePath: join(dir, "src", "app.ts"),
        content: "console.log('x');",
      },
    });

    expect(out.status).toBe("allow");
    expect(out.activityResult).toBeNull();
    expect(existsSync(join(dir, ".prism", "activity.log"))).toBe(false);
  });

  it("no ruleset: fails open with a logged SKIPPED no-rules (cwd fallback log)", async () => {
    const dir = join(
      tmpdir(),
      `prism-opencode-norules-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(join(dir, ".prism"), { recursive: true });
    dirs.push(dir);

    const out = await handleOpenCodeToolEvent(
      "pre",
      {
        tool: "write",
        args: { filePath: join(dir, "src", "app.ts"), content: "console.log('x');" },
      },
      { cwd: dir },
    );

    expect(out.status).toBe("allow");
    expect(out.activityResult).toBe("SKIPPED no-rules");
    const [line] = activityLines(dir);
    expect(line.split("\t").slice(1)).toEqual([
      "pre",
      join(dir, "src", "app.ts"),
      "SKIPPED no-rules",
    ]);
  });

  it("non-applicable extension fails open with a logged skip", async () => {
    const dir = makeProject("not-applicable");
    const out = await handleOpenCodeToolEvent("pre", {
      tool: "write",
      args: {
        filePath: join(dir, "notes.txt"),
        content: "console.log('x');",
      },
    });

    expect(out.status).toBe("allow");
    expect(out.activityResult).toBe("SKIPPED not-applicable");
    expect(activityLines(dir)[0]).toContain("\tSKIPPED not-applicable");
  });

  it("post: re-reads the file from disk, blocks, and logs with event 'post'", async () => {
    const dir = makeProject("post-block");
    const filePath = join(dir, "src", "app.ts");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(filePath, "console.log('already there');\n");

    const out = await handleOpenCodeToolEvent("post", {
      tool: "write",
      args: { filePath, content: "ignored on post" },
    });

    expect(out.status).toBe("block");
    expect(out.activityResult).toBe("BLOCKED no-console-log");
    const [ts, phase, file, result] = activityLines(dir)[0].split("\t");
    expect(phase).toBe("post");
    expect(file).toBe(filePath);
    expect(result).toBe("BLOCKED no-console-log");
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("post: missing file fails open with SKIPPED file-unreadable", async () => {
    const dir = makeProject("post-unreadable");
    const out = await handleOpenCodeToolEvent("post", {
      tool: "edit",
      args: { filePath: join(dir, "src", "gone.ts"), oldString: "a", newString: "b" },
    });

    expect(out.status).toBe("allow");
    expect(out.activityResult).toBe("SKIPPED file-unreadable");
  });

  it("apply_patch pre: gates on added lines (relative path resolved via cwd)", async () => {
    const dir = makeProject("patch-block");
    const out = await handleOpenCodeToolEvent(
      "pre",
      {
        tool: "apply_patch",
        args: {
          patchText: [
            "*** Begin Patch",
            "*** Update File: src/app.ts",
            "@@",
            "-const old = 1;",
            "+console.log('new');",
            "*** End Patch",
          ].join("\n"),
        },
      },
      { cwd: dir },
    );

    expect(out.status).toBe("block");
    expect(out.activityResult).toBe("BLOCKED no-console-log");
    expect(activityLines(dir)[0].split("\t")[2]).toBe("src/app.ts");
  });

  it("apply_patch pre: a patch that only REMOVES a violation is clean (no false positive)", async () => {
    const dir = makeProject("patch-remove");
    const out = await handleOpenCodeToolEvent(
      "pre",
      {
        tool: "apply_patch",
        args: {
          patchText: [
            "*** Begin Patch",
            "*** Update File: src/app.ts",
            "@@",
            "-console.log('bye');",
            "+const clean = 1;",
            "*** End Patch",
          ].join("\n"),
        },
      },
      { cwd: dir },
    );

    expect(out.status).toBe("allow");
    expect(out.activityResult).toBe("CLEAN");
  });

  it("apply_patch multi-file: one line per touched file, blocks on the violating one", async () => {
    const dir = makeProject("patch-multi");
    const out = await handleOpenCodeToolEvent(
      "pre",
      {
        tool: "apply_patch",
        args: {
          patchText: [
            "*** Begin Patch",
            "*** Add File: src/ok.ts",
            "+export const fine = 1;",
            "*** Add File: src/bad.ts",
            "+console.log('x');",
            "*** End Patch",
          ].join("\n"),
        },
      },
      { cwd: dir },
    );

    expect(out.status).toBe("block");
    expect(out.activityResult).toBe("CLEAN | BLOCKED no-console-log");
    const lines = activityLines(dir);
    expect(lines).toHaveLength(2);
    expect(lines[0].split("\t").slice(1)).toEqual([
      "pre",
      "src/ok.ts",
      "CLEAN",
    ]);
    expect(lines[1].split("\t").slice(1)).toEqual([
      "pre",
      "src/bad.ts",
      "BLOCKED no-console-log",
    ]);
    expect(out.message).toContain("bad.ts");
    expect(out.message).not.toContain("ok.ts —");
  });
});
