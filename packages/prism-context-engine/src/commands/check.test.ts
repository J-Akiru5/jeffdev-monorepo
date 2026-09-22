import { describe, it, expect } from "vitest";
import { extractFilePath } from "./check.js";

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