import { describe, it, expect, beforeEach } from "vitest";
import {
  applyGremlinBoosts,
  DEFAULT_GREMLIN_CONFIG,
  type BoostMap,
} from "./gremlin-ranking.js";
import type { RankedRule } from "./smart-select.js";

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

describe("applyGremlinBoosts", () => {
  it("should boost similarity for rules in the boost map", () => {
    const rules: RankedRule[] = [
      makeRankedRule({ id: "a", similarity: 0.9 }),
      makeRankedRule({ id: "b", similarity: 0.7 }),
      makeRankedRule({ id: "c", similarity: 0.5 }),
    ];

    const boosts: BoostMap = { a: 1.0, b: 1.2, c: 1.0 };

    const { rules: boosted, changedIds } = applyGremlinBoosts(rules, boosts);

    expect(changedIds).toContain("b");
    expect(boosted.find((r) => r.id === "b")?.similarity).toBeCloseTo(0.84, 2);
    // Order should change: b (0.84) should now be ahead of a (0.9) — no, 0.9 > 0.84
    expect(boosted[0]!.id).toBe("a");
    expect(boosted[1]!.id).toBe("b");
  });

  it("should apply conflict penalties", () => {
    const rules: RankedRule[] = [
      makeRankedRule({ id: "a", similarity: 0.9 }),
      makeRankedRule({ id: "b", similarity: 0.85 }),
    ];

    const boosts: BoostMap = { b: 0.8 }; // penalty

    const { rules: boosted } = applyGremlinBoosts(rules, boosts);

    expect(boosted.find((r) => r.id === "b")?.similarity).toBeCloseTo(0.68, 2);
  });

  it("should clamp similarity between 0 and 1", () => {
    const rules: RankedRule[] = [makeRankedRule({ id: "a", similarity: 0.95 })];

    const boosts: BoostMap = { a: 1.2 }; // would push to 1.14

    const { rules: boosted } = applyGremlinBoosts(rules, boosts);

    expect(boosted[0]!.similarity).toBeLessThanOrEqual(1);
  });

  it("should return empty changedIds when no boosts match", () => {
    const rules: RankedRule[] = [makeRankedRule({ id: "a", similarity: 0.9 })];

    const boosts: BoostMap = { b: 1.2 };

    const { changedIds } = applyGremlinBoosts(rules, boosts);

    expect(changedIds).toHaveLength(0);
  });

  it("should return empty changedIds for empty boost map", () => {
    const rules: RankedRule[] = [makeRankedRule({ id: "a", similarity: 0.9 })];

    const { changedIds } = applyGremlinBoosts(rules, {});

    expect(changedIds).toHaveLength(0);
  });

  it("should handle empty rules array", () => {
    const { rules, changedIds } = applyGremlinBoosts([], { a: 1.2 });
    expect(rules).toHaveLength(0);
    expect(changedIds).toHaveLength(0);
  });

  it("should re-sort rules after applying boosts", () => {
    const rules: RankedRule[] = [
      makeRankedRule({ id: "a", similarity: 0.7 }),
      makeRankedRule({ id: "b", similarity: 0.6 }),
      makeRankedRule({ id: "c", similarity: 0.5 }),
    ];

    // Boost b above a
    const boosts: BoostMap = { b: 1.3 }; // 0.6 * 1.3 = 0.78 > 0.7

    const { rules: boosted } = applyGremlinBoosts(rules, boosts);

    expect(boosted[0]!.id).toBe("b");
    expect(boosted[1]!.id).toBe("a");
    expect(boosted[2]!.id).toBe("c");
  });
});

describe("isGremlinRankingEnabled", () => {
  beforeEach(() => {
    delete process.env.USE_GREMLIN_RANKING;
  });

  it("should return false by default", async () => {
    const { isGremlinRankingEnabled } = await import("./gremlin-ranking.js");
    expect(isGremlinRankingEnabled()).toBe(false);
  });

  it("should return true when env var is 'true'", async () => {
    process.env.USE_GREMLIN_RANKING = "true";
    const { isGremlinRankingEnabled } = await import("./gremlin-ranking.js");
    expect(isGremlinRankingEnabled()).toBe(true);
  });

  it("should return false for any non-'true' value", async () => {
    process.env.USE_GREMLIN_RANKING = "false";
    const { isGremlinRankingEnabled } = await import("./gremlin-ranking.js");
    expect(isGremlinRankingEnabled()).toBe(false);
  });
});

describe("DEFAULT_GREMLIN_CONFIG", () => {
  it("should have reasonable default values", () => {
    expect(DEFAULT_GREMLIN_CONFIG.tagMatchBonus).toBe(0.08);
    expect(DEFAULT_GREMLIN_CONFIG.relatedRuleBoost).toBe(0.12);
    expect(DEFAULT_GREMLIN_CONFIG.conflictPenalty).toBe(-0.15);
    expect(DEFAULT_GREMLIN_CONFIG.seedCount).toBe(3);
  });
});
