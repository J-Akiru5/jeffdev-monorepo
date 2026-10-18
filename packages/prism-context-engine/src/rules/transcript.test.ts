import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { changedFilesFromTranscript } from "./transcript.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-transcript-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("changedFilesFromTranscript", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("collects file_path from Write/Edit/MultiEdit tool_use entries", () => {
    const dir = makeTmpDir("collect");
    dirs.push(dir);
    const file = join(dir, "session.jsonl");
    writeFileSync(
      file,
      [
        JSON.stringify({
          type: "user",
          message: { role: "user", content: "please edit" },
        }),
        JSON.stringify({
          type: "assistant",
          message: {
            role: "assistant",
            content: [
              {
                type: "tool_use",
                name: "Write",
                input: { file_path: "C:\\a\\Button.tsx", content: "x" },
              },
            ],
          },
        }),
        JSON.stringify({
          type: "assistant",
          message: {
            role: "assistant",
            content: [
              {
                type: "tool_use",
                name: "Edit",
                input: {
                  file_path: "C:\\a\\Danger.tsx",
                  old_string: "a",
                  new_string: "b",
                },
              },
              {
                type: "tool_use",
                name: "Bash",
                input: { command: "ls" },
              },
            ],
          },
        }),
        JSON.stringify({
          type: "assistant",
          message: {
            role: "assistant",
            content: [
              {
                type: "tool_use",
                name: "MultiEdit",
                input: { file_path: "C:\\a\\Multi.tsx", edits: [] },
              },
            ],
          },
        }),
        "{ malformed json",
        "",
      ].join("\n"),
    );

    expect(changedFilesFromTranscript(file).sort()).toEqual(
      ["C:\\a\\Button.tsx", "C:\\a\\Danger.tsx", "C:\\a\\Multi.tsx"].sort(),
    );
  });

  it("deduplicates repeated edits to the same file", () => {
    const dir = makeTmpDir("dedupe");
    dirs.push(dir);
    const file = join(dir, "session.jsonl");
    const line = (path: string) =>
      JSON.stringify({
        type: "assistant",
        message: {
          role: "assistant",
          content: [
            { type: "tool_use", name: "Edit", input: { file_path: path } },
          ],
        },
      });
    writeFileSync(file, [line("C:\\a\\Button.tsx"), line("C:\\a\\Button.tsx")].join("\n"));
    expect(changedFilesFromTranscript(file)).toEqual(["C:\\a\\Button.tsx"]);
  });

  it("returns [] for a missing transcript", () => {
    expect(
      changedFilesFromTranscript(join(tmpdir(), "prism-missing-transcript.jsonl")),
    ).toEqual([]);
  });

  it("ignores entries without a usable file_path", () => {
    const dir = makeTmpDir("no-path");
    dirs.push(dir);
    const file = join(dir, "session.jsonl");
    writeFileSync(
      file,
      JSON.stringify({
        type: "assistant",
        message: {
          role: "assistant",
          content: [{ type: "tool_use", name: "Edit", input: {} }],
        },
      }),
    );
    expect(changedFilesFromTranscript(file)).toEqual([]);
  });
});
