import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  appendActivity,
  formatActivityLine,
  resolveActivityLogPath,
} from "./activity.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-activity-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("formatActivityLine", () => {
  it("renders tab-separated timestamp/event/file/result", () => {
    const line = formatActivityLine(
      "pre",
      "C:\\src\\Button.tsx",
      "BLOCKED rule-1",
      new Date("2026-09-22T00:00:00.000Z"),
    );
    expect(line).toBe(
      "2026-09-22T00:00:00.000Z\tpre\tC:\\src\\Button.tsx\tBLOCKED rule-1",
    );
  });
});

describe("appendActivity", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("appends one line per call", () => {
    const dir = makeTmpDir("append");
    dirs.push(dir);
    const logPath = join(dir, "activity.log");
    appendActivity(logPath, "line-one");
    appendActivity(logPath, "line-two");
    expect(readFileSync(logPath, "utf8")).toBe("line-one\nline-two\n");
  });

  it("never throws and returns false when the path is a directory", () => {
    const dir = makeTmpDir("unwritable");
    dirs.push(dir);
    let result = true;
    expect(() => {
      result = appendActivity(dir, "line");
    }).not.toThrow();
    expect(result).toBe(false);
  });

  it("returns false (no-op) for a null log path", () => {
    expect(appendActivity(null, "line")).toBe(false);
  });
});

describe("resolveActivityLogPath", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prefers the ruleset directory when one was found", () => {
    const dir = makeTmpDir("rules");
    dirs.push(dir);
    const rulesPath = join(dir, ".prism", "rules.json");
    expect(resolveActivityLogPath(rulesPath, "C:\\elsewhere")).toBe(
      join(dir, ".prism", "activity.log"),
    );
  });

  it("falls back to cwd only when .prism already exists there", () => {
    const dir = makeTmpDir("cwd");
    dirs.push(dir);
    expect(resolveActivityLogPath(null, dir)).toBeNull();
    mkdirSync(join(dir, ".prism"), { recursive: true });
    expect(resolveActivityLogPath(null, dir)).toBe(
      join(dir, ".prism", "activity.log"),
    );
  });

  it("returns null when neither source is available", () => {
    expect(resolveActivityLogPath(null, null)).toBeNull();
  });
});
