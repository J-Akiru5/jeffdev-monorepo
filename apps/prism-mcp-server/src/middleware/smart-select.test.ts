import { describe, it, expect, beforeEach } from "vitest";
import {
  formatRulesResponse,
  deduplicateRules,
  clearEmbeddingCache,
  type SmartSelectResult,
  type RankedRule,
} from "./smart-select.js";

function makeRankedRule(overrides: Partial<RankedRule> = {}): RankedRule {
  return {
    id: "rule-1",
    name: "Test Rule",
    content: "Always use Tailwind CSS classes instead of inline styles.",
    priority: 5,
    category: "styling",
    similarity: 0.85,
    truncated: false,
    ...overrides,
  };
}

describe("formatRulesResponse with skills", () => {
  beforeEach(() => {
    clearEmbeddingCache();
  });

  it("should include skills metadata in markdown output", () => {
    const result: SmartSelectResult = {
      rules: [
        makeRankedRule({ id: "r1", name: "Color Usage", similarity: 0.91 }),
      ],
      skills: [
        {
          id: "s1",
          name: "Styling a Button",
          summary: "How to style buttons using the design system",
          tokenCount: 320,
        },
        {
          id: "s2",
          name: "Adding a Page",
          summary: "Step-by-step guide to create new pages",
          tokenCount: 450,
        },
      ],
      skippedRules: 2,
      dedupedRules: 0,
      totalRules: 5,
      tokenCount: 890,
    };
    const text = formatRulesResponse(result, "build a button", "markdown");
    expect(text).toContain("# Prism Architectural Rules");
    expect(text).toContain("Color Usage");
    expect(text).toContain("Available Skills");
    expect(text).toContain("Styling a Button");
    expect(text).toContain("Adding a Page");
    expect(text).toContain("get_skill");
    expect(text).toContain("1 of 5 (2 skipped, 0 deduplicated)");
    expect(text).toContain("890");
  });

  it("should include skills metadata in JSON output", () => {
    const result: SmartSelectResult = {
      rules: [makeRankedRule({ id: "r1", name: "Color Usage" })],
      skills: [
        {
          id: "s1",
          name: "Styling a Button",
          summary: "Button styling guide",
          tokenCount: 320,
        },
      ],
      skippedRules: 0,
      dedupedRules: 0,
      totalRules: 2,
      tokenCount: 420,
    };
    const text = formatRulesResponse(result, "build nav", "json");
    const parsed = JSON.parse(text);
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].name).toBe("Styling a Button");
    expect(parsed.skills[0].summary).toBe("Button styling guide");
    expect(parsed.meta.tokenCount).toBe(420);
    expect(parsed.meta.dedupedRules).toBe(0);
  });

  it("should show skills-only result when no rules match", () => {
    const result: SmartSelectResult = {
      rules: [],
      skills: [
        {
          id: "s1",
          name: "Component Guide",
          summary: "How to build components",
          tokenCount: 500,
        },
      ],
      skippedRules: 0,
      dedupedRules: 0,
      totalRules: 1,
      tokenCount: 500,
    };
    const text = formatRulesResponse(result, "build component", "markdown");
    expect(text).toContain("Available Skills");
    expect(text).toContain("Component Guide");
    expect(text).not.toContain("Rules returned");
  });

  it("should show empty message when no rules and no skills", () => {
    const result: SmartSelectResult = {
      rules: [],
      skills: [],
      skippedRules: 0,
      dedupedRules: 0,
      totalRules: 10,
      tokenCount: 0,
    };
    const text = formatRulesResponse(result, "unknown task", "markdown");
    expect(text).toContain("No rules found relevant to");
  });
});

describe("deduplicateRules", () => {
  it("should merge rules with overlapping content", () => {
    const longContent =
      "Use Tailwind CSS for all styling. Avoid inline styles. Tailwind provides utility classes for padding, margin, colors, typography, and layout. Never use inline styles as they break the design system consistency and make maintenance harder. Instead, compose Tailwind classes using clsx or cn utilities.";
    const rules: RankedRule[] = [
      makeRankedRule({ id: "a", content: longContent, priority: 3 }),
      makeRankedRule({
        id: "b",
        content:
          longContent.replace("Use Tailwind", "Always use Tailwind") +
          " This is nearly identical content that should be deduplicated.",
        priority: 2,
      }),
    ];
    const { rules: deduped, dedupedCount } = deduplicateRules(rules);
    expect(deduped.length).toBeLessThan(rules.length);
    expect(dedupedCount).toBeGreaterThan(0);
  });

  it("should keep distinct rules", () => {
    const rules: RankedRule[] = [
      makeRankedRule({
        id: "a",
        content: "Use Tailwind CSS for all styling.",
        priority: 3,
      }),
      makeRankedRule({
        id: "b",
        content: "All API routes must validate input with Zod.",
        priority: 1,
      }),
    ];
    const { rules: deduped, dedupedCount } = deduplicateRules(rules);
    expect(deduped).toHaveLength(2);
    expect(dedupedCount).toBe(0);
  });

  it("should handle empty array", () => {
    const { rules: deduped, dedupedCount } = deduplicateRules([]);
    expect(deduped).toHaveLength(0);
    expect(dedupedCount).toBe(0);
  });

  it("should handle single rule", () => {
    const rules = [makeRankedRule({ id: "a" })];
    const { rules: deduped, dedupedCount } = deduplicateRules(rules);
    expect(deduped).toHaveLength(1);
    expect(dedupedCount).toBe(0);
  });
});
