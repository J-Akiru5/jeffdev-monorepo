import { describe, it, expect } from "vitest";
import {
  extractFilePath,
  extractProposedContent,
  resolveHookMode,
  shouldBlockStop,
  type HookEvent,
} from "./check.js";

describe("extractFilePath", () => {
  it("reads the Claude Code nested shape (tool_input.file_path)", () => {
    const event = {
      hook_event_name: "PostToolUse",
      tool_name: "Write",
      tool_input: { file_path: "src/components/Button.tsx" },
    };
    expect(extractFilePath(event)).toBe("src/components/Button.tsx");
  });

  it("reads the Cursor top-level shape (file_path)", () => {
    const event = { file_path: "src/components/Button.tsx" };
    expect(extractFilePath(event)).toBe("src/components/Button.tsx");
  });

  it("reads the top-level camelCase shape (filePath)", () => {
    const event = { filePath: "src/components/Button.tsx" };
    expect(extractFilePath(event)).toBe("src/components/Button.tsx");
  });

  it("reads the Antigravity nested shape (toolCall.args.filePath)", () => {
    const event = {
      toolCall: {
        name: "edit_file",
        args: { filePath: "src/components/Button.tsx", oldText: "a", newText: "b" },
      },
      stepIdx: 0,
    };
    expect(extractFilePath(event)).toBe("src/components/Button.tsx");
  });

  it("reads the Antigravity PascalCase arg (toolCall.args.FilePath)", () => {
    const event = {
      toolCall: { name: "edit_file", args: { FilePath: "src/a.ts" } },
    };
    expect(extractFilePath(event)).toBe("src/a.ts");
  });

  it("reads the Antigravity snake_case arg (toolCall.args.file_path)", () => {
    const event = {
      toolCall: { name: "write_file", args: { file_path: "src/a.ts" } },
    };
    expect(extractFilePath(event)).toBe("src/a.ts");
  });

  it("reads a plain path arg (toolCall.args.path)", () => {
    const event = {
      toolCall: { name: "edit_file", args: { path: "src/a.ts" } },
    };
    expect(extractFilePath(event)).toBe("src/a.ts");
  });

  it("returns null when no path-bearing field exists", () => {
    const event = { toolCall: { name: "list_dir", args: { DirectoryPath: "src" } } };
    expect(extractFilePath(event)).toBeNull();
  });

  it("returns null on empty or non-string path values", () => {
    expect(extractFilePath({ toolCall: { name: "edit_file", args: { filePath: "" } } })).toBeNull();
    expect(extractFilePath({ toolCall: { name: "edit_file", args: { filePath: 42 } } })).toBeNull();
    expect(extractFilePath({ toolCall: { name: "edit_file", args: {} } })).toBeNull();
    expect(extractFilePath({})).toBeNull();
  });
});

describe("resolveHookMode", () => {
  it("maps Claude Code snake_case event names", () => {
    expect(resolveHookMode({ hook_event_name: "PreToolUse" })).toBe("pre");
    expect(resolveHookMode({ hook_event_name: "PostToolUse" })).toBe("post");
    expect(resolveHookMode({ hook_event_name: "Stop" })).toBe("stop");
  });

  it("maps camelCase event names (Antigravity shape)", () => {
    expect(resolveHookMode({ hookEventName: "PreToolUse" })).toBe("pre");
  });

  it("defaults to post when the payload has no event name (legacy)", () => {
    expect(resolveHookMode({ file_path: "src/a.ts" })).toBe("post");
  });
});

describe("shouldBlockStop (loop guard)", () => {
  it("blocks while stop_hook_active is false or absent", () => {
    expect(shouldBlockStop({})).toBe(true);
    expect(shouldBlockStop({ stop_hook_active: false })).toBe(true);
  });

  it("never blocks again once stop_hook_active is true", () => {
    expect(shouldBlockStop({ stop_hook_active: true })).toBe(false);
  });
});

describe("extractProposedContent", () => {
  const writeEvent = (content: string): HookEvent => ({
    tool_name: "Write",
    tool_input: { file_path: "src/Button.tsx", content },
  });

  const editEvent = (extra: Record<string, unknown>): HookEvent => ({
    tool_name: "Edit",
    tool_input: { file_path: "src/Button.tsx", ...extra },
  });

  const multiEditEvent = (edits: unknown[]): HookEvent => ({
    tool_name: "MultiEdit",
    tool_input: { file_path: "src/Button.tsx", edits },
  });

  it("Write: uses tool_input.content without reading the target file", () => {
    const result = extractProposedContent(
      writeEvent("const color = '#ef4444';"),
      () => {
        throw new Error("must not read the target for Write");
      },
    );
    expect(result).toEqual({ ok: true, content: "const color = '#ef4444';" });
  });

  it("Edit: applies old_string -> new_string to the current contents", () => {
    const result = extractProposedContent(
      editEvent({ old_string: "bbb", new_string: "ccc" }),
      () => "aaa\nbbb\nccc\n",
    );
    expect(result).toEqual({ ok: true, content: "aaa\nccc\nccc\n" });
  });

  it("Edit: honors replace_all", () => {
    const result = extractProposedContent(
      editEvent({ old_string: "x", new_string: "y", replace_all: true }),
      () => "x x x",
    );
    expect(result).toEqual({ ok: true, content: "y y y" });
  });

  it("Edit: fails open when old_string is not present", () => {
    const result = extractProposedContent(
      editEvent({ old_string: "nope", new_string: "y" }),
      () => "aaa",
    );
    expect(result).toEqual({ ok: false, reason: "old-string-not-found" });
  });

  it("Edit: fails open on an empty old_string", () => {
    const result = extractProposedContent(
      editEvent({ old_string: "", new_string: "y" }),
      () => "aaa",
    );
    expect(result).toEqual({ ok: false, reason: "empty-old-string" });
  });

  it("Edit: fails open when the base file is unreadable", () => {
    const result = extractProposedContent(
      editEvent({ old_string: "a", new_string: "b" }),
      () => {
        throw new Error("ENOENT");
      },
    );
    expect(result).toEqual({ ok: false, reason: "file-unreadable" });
  });

  it("MultiEdit: applies edits in order against the running content", () => {
    const result = extractProposedContent(
      multiEditEvent([
        { old_string: "a", new_string: "X" },
        { old_string: "X", new_string: "Y" },
        { old_string: "b", new_string: "B", replace_all: true },
      ]),
      () => "a\nb b\n",
    );
    expect(result).toEqual({ ok: true, content: "Y\nB B\n" });
  });

  it("MultiEdit: fails open when any edit cannot be applied", () => {
    const result = extractProposedContent(
      multiEditEvent([
        { old_string: "a", new_string: "X" },
        { old_string: "gone", new_string: "Z" },
      ]),
      () => "a",
    );
    expect(result).toEqual({ ok: false, reason: "old-string-not-found" });
  });

  it("returns explicit reasons for missing payload pieces", () => {
    expect(extractProposedContent({})).toEqual({
      ok: false,
      reason: "missing-tool-input",
    });
    expect(extractProposedContent({ tool_input: { content: "x" } })).toEqual({
      ok: false,
      reason: "missing-file-path",
    });
    expect(
      extractProposedContent({ tool_input: { file_path: "src/a.ts" } }),
    ).toEqual({ ok: false, reason: "no-proposed-content" });
  });
});