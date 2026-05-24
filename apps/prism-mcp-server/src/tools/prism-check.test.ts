import { describe, it, expect } from "vitest";
import { findLineColumn, buildSuggestion } from "./prism-check.js";

describe("findLineColumn", () => {
  it("returns line 1, column 1 for start of file", () => {
    const pos = findLineColumn("hello world", 0);
    expect(pos).toEqual({ line: 1, column: 1 });
  });

  it("tracks column position within a line", () => {
    const pos = findLineColumn("hello world", 5);
    expect(pos).toEqual({ line: 1, column: 6 });
  });

  it("increments line on newline", () => {
    const pos = findLineColumn("line1\nline2\nline3", 12);
    expect(pos).toEqual({ line: 3, column: 1 }); // index 12 = start of line3
  });

  it("handles multiple newlines", () => {
    const pos = findLineColumn("a\nb\nc\nd", 5);
    expect(pos).toEqual({ line: 3, column: 2 });
  });

  it("handles empty string edge case", () => {
    const pos = findLineColumn("", 0);
    expect(pos).toEqual({ line: 1, column: 1 });
  });
});

describe("buildSuggestion", () => {
  it("wraps matched text in backticks", () => {
    const result = buildSuggestion(
      "No inline styles",
      "Avoid using inline styles like style={{}}",
      "style={{}}",
    );
    expect(result).toContain("`style={{}}`");
    expect(result).toContain("No inline styles");
  });

  it("strips bold markers from content", () => {
    const result = buildSuggestion(
      "Rule",
      "**Important:** Do **not** do this",
      "this",
    );
    expect(result).not.toContain("**");
    expect(result).toContain("Important:");
  });
});
