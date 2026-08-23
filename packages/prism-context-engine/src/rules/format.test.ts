import { describe, it, expect } from "vitest";
import { formatHookClaudeCode, formatFindingLine, formatPretty } from "./format.js";
import type { Finding } from "./types.js";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    ruleId: "styling/no-hex",
    severity: "block",
    category: "styling",
    file: "src/components/PrimaryButton.tsx",
    line: 12,
    offending: "#06b6d4",
    replacement: "var(--brand-primary)",
    message: "Use the design token.",
    ...overrides,
  };
}

describe("formatHookClaudeCode", () => {
  it("names file, line, offending value and exact replacement", () => {
    const text = formatHookClaudeCode(
      "src/components/PrimaryButton.tsx",
      [finding()],
    );
    expect(text).toContain("PrimaryButton.tsx");
    expect(text).toContain("Line 12");
    expect(text).toContain("'#06b6d4'");
    expect(text).toContain("with 'var(--brand-primary)'");
    expect(text).toContain("(styling/no-hex)");
    expect(text).toContain("continue your original task");
  });

  it("caps at five findings with an overflow note", () => {
    const blocks = Array.from({ length: 8 }, (_, i) =>
      finding({ line: i + 1 }),
    );
    const text = formatHookClaudeCode("f.tsx", blocks);
    expect(text).toContain("8 rule violations");
    expect(text).toContain("...and 3 more.");
    expect(text).not.toContain("Line 6 ");
  });
});

describe("formatFindingLine", () => {
  it("renders location, severity, rule and fix", () => {
    const line = formatFindingLine(finding());
    expect(line).toBe(
      "src/components/PrimaryButton.tsx:12 [block] styling/no-hex: Use the design token. Found '#06b6d4' — replace it with 'var(--brand-primary)'.",
    );
  });

  it("renders without a replacement when none exists", () => {
    const line = formatFindingLine(finding({ replacement: undefined }));
    expect(line).toContain("Found '#06b6d4'.");
    expect(line).not.toContain("replace it with");
  });
});

describe("formatPretty", () => {
  it("summarizes empty results", () => {
    expect(formatPretty(new Map(), 0, 0)).toContain("no violations");
  });

  it("groups findings per file with block/warn counts", () => {
    const map = new Map<string, Finding[]>([
      [
        "a.tsx",
        [finding(), finding({ ruleId: "w/rule", severity: "warn", line: 3 })],
      ],
    ]);
    const out = formatPretty(map, 1, 1);
    expect(out).toContain("a.tsx");
    expect(out).toContain("BLOCK");
    expect(out).toContain("WARN ");
    expect(out).toContain("1 blocking, 1 warning");
  });
});
