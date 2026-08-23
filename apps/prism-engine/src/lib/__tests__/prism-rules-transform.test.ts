import { describe, it, expect } from "vitest";
import {
  mapSeverity,
  mapCategory,
  toV1Rule,
  type PrismRulesRow,
} from "../prism-rules-transform";

function row(overrides: Partial<PrismRulesRow> = {}): PrismRulesRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "No raw hex colors",
    description: "Use design tokens instead of hex literals.",
    content: "Every color comes from the design tokens.",
    category: "styling",
    severity: "warning",
    pattern: null,
    ...overrides,
  };
}

describe("mapSeverity", () => {
  it("maps error -> block", () => {
    expect(mapSeverity("error")).toBe("block");
  });
  it("maps warning -> warn", () => {
    expect(mapSeverity("warning")).toBe("warn");
  });
  it("maps info -> warn (v1 has no third severity)", () => {
    expect(mapSeverity("info")).toBe("warn");
  });
  it("maps anything unrecognized (including null) -> warn, never block", () => {
    expect(mapSeverity(null)).toBe("warn");
    expect(mapSeverity(undefined)).toBe("warn");
    expect(mapSeverity("whatever")).toBe("warn");
  });
});

describe("mapCategory", () => {
  it.each(["architecture", "styling", "security", "testing"] as const)(
    "passes v1 category %s through unchanged",
    (category) => {
      expect(mapCategory(category)).toBe(category);
    },
  );

  it.each(["performance", "documentation", "custom"])(
    "folds non-v1 category %s into architecture rather than dropping the rule",
    (category) => {
      expect(mapCategory(category)).toBe("architecture");
    },
  );

  it("defaults null/undefined/unknown category to architecture", () => {
    expect(mapCategory(null)).toBe("architecture");
    expect(mapCategory(undefined)).toBe("architecture");
    expect(mapCategory("something-new")).toBe("architecture");
  });
});

describe("toV1Rule", () => {
  it("produces an advisory-only rule (no check) when pattern is null", () => {
    const result = toV1Rule(row({ pattern: null }));
    expect(result.check).toBeUndefined();
    expect(result.id).toBe(row().id);
    expect(result.category).toBe("styling");
    expect(result.severity).toBe("warn");
  });

  it("produces a forbidden_pattern check from a valid stored pattern", () => {
    const result = toV1Rule(
      row({ pattern: "#[0-9a-fA-F]{6}\\b", severity: "error" }),
    );
    expect(result.severity).toBe("block");
    expect(result.check).toEqual({
      type: "forbidden_pattern",
      pattern: "#[0-9a-fA-F]{6}\\b",
      message: row().description,
    });
  });

  it("falls back to advisory-only when the stored pattern doesn't compile as a regex", () => {
    const result = toV1Rule(row({ pattern: "(unterminated[" }));
    expect(result.check).toBeUndefined();
    // The rest of the rule still comes through — one bad pattern doesn't
    // drop the whole rule.
    expect(result.instruction).toBe(row().content);
  });

  it("prefers content, then description, then name for the instruction text", () => {
    expect(toV1Rule(row({ content: "C", description: "D", name: "N" })).instruction).toBe(
      "C",
    );
    expect(
      toV1Rule(row({ content: "", description: "D", name: "N" })).instruction,
    ).toBe("D");
    expect(
      toV1Rule(row({ content: "", description: null, name: "N" })).instruction,
    ).toBe("N");
  });

  it("uses the row's own id as the v1 rule id (stable across repeat pulls)", () => {
    const result = toV1Rule(row({ id: "abc-123" }));
    expect(result.id).toBe("abc-123");
  });
});
