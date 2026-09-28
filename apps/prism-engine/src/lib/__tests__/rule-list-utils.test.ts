import { describe, it, expect } from "vitest";
import {
  distinctCategories,
  filterRules,
  groupRulesByCategory,
  normalizeSeverity,
} from "../rule-list-utils";

function rule(overrides: Partial<{
  name: string;
  content: string;
  category: string;
}> = {}) {
  return {
    name: "No raw hex colors",
    content: "Use the palette tokens instead of hex values.",
    category: "styling",
    ...overrides,
  };
}

describe("normalizeSeverity", () => {
  it("passes through known severities", () => {
    expect(normalizeSeverity("error")).toBe("error");
    expect(normalizeSeverity("warning")).toBe("warning");
    expect(normalizeSeverity("info")).toBe("info");
  });

  it("falls back to warning for null/unknown values (schema default)", () => {
    expect(normalizeSeverity(null)).toBe("warning");
    expect(normalizeSeverity(undefined)).toBe("warning");
    expect(normalizeSeverity("bogus")).toBe("warning");
  });
});

describe("filterRules", () => {
  const rules = [
    rule({ name: "No raw hex colors", content: "palette tokens", category: "styling" }),
    rule({ name: "Mock classifier only", content: "no roboflow imports", category: "architecture" }),
    rule({ name: "Service role server only", content: "never in .tsx", category: "security" }),
  ];

  it("returns everything for an empty/whitespace query and no category", () => {
    expect(filterRules(rules, "", null)).toHaveLength(3);
    expect(filterRules(rules, "   ", null)).toHaveLength(3);
  });

  it("matches name case-insensitively", () => {
    expect(filterRules(rules, "HEX", null).map((r) => r.name)).toEqual([
      "No raw hex colors",
    ]);
  });

  it("matches instruction content", () => {
    expect(filterRules(rules, "roboflow", null).map((r) => r.name)).toEqual([
      "Mock classifier only",
    ]);
  });

  it("filters by exact category", () => {
    expect(filterRules(rules, "", "security").map((r) => r.name)).toEqual([
      "Service role server only",
    ]);
  });

  it("combines query and category", () => {
    expect(filterRules(rules, "palette", "architecture")).toHaveLength(0);
    expect(filterRules(rules, "palette", "styling")).toHaveLength(1);
  });

  it("preserves input order", () => {
    const reversed = [...rules].reverse();
    expect(filterRules(reversed, "", null).map((r) => r.name)).toEqual(
      reversed.map((r) => r.name),
    );
  });
});

describe("groupRulesByCategory", () => {
  it("groups by category in alphabetical order, preserving within-group order", () => {
    const rules = [
      rule({ name: "b1", category: "styling" }),
      rule({ name: "a1", category: "architecture" }),
      rule({ name: "b2", category: "styling" }),
      rule({ name: "s1", category: "security" }),
    ];
    const groups = groupRulesByCategory(rules);
    expect(groups.map((g) => g.category)).toEqual([
      "architecture",
      "security",
      "styling",
    ]);
    expect(groups[2]!.rules.map((r) => r.name)).toEqual(["b1", "b2"]);
  });

  it("returns an empty array for no rules", () => {
    expect(groupRulesByCategory([])).toEqual([]);
  });
});

describe("distinctCategories", () => {
  it("returns unique categories sorted alphabetically", () => {
    const rules = [
      rule({ category: "styling" }),
      rule({ category: "architecture" }),
      rule({ category: "styling" }),
    ];
    expect(distinctCategories(rules)).toEqual(["architecture", "styling"]);
  });
});
