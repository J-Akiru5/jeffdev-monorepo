/**
 * Gremlin graph ranking for Prism smart-select.
 *
 * Uses Cosmos DB Gremlin graph relationships to boost (or penalize) rule
 * relevance scores on top of embedding-based similarity.
 *
 * Design:
 * - Given a task embedding + a list of candidate rule IDs, query the graph
 *   for additional relevance signals: tag overlap, "relates_to" edges,
 *   "conflicts_with" edges, and priority neighbors.
 * - Returns a BoostMap: a flat record of `ruleId → boostMultiplier`.
 *
 * Feature flag: USE_GREMLIN_RANKING (default: "false")
 * When enabled, the smart-select pipeline applies these boosts after
 * cosine similarity scoring but before dedup/truncation.
 */

import type { RankedRule } from "./smart-select.js";

// @ts-expect-error - gremlin package has no TypeScript declarations
import gremlin from "gremlin";

const { process: gremlinProcess } = gremlin;
const { P } = gremlinProcess;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GremlinRankingConfig {
  /** Tag overlap bonus (per shared tag) */
  tagMatchBonus: number;
  /** Boost for rules that share a "relates_to" edge with high-similarity rules */
  relatedRuleBoost: number;
  /** Penalty for rules that "conflicts_with" the top-ranked rule */
  conflictPenalty: number;
  /** Number of top-similarity rules to use as "seed" for graph traversal */
  seedCount: number;
}

export type BoostMap = Record<string, number>;

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const DEFAULT_GREMLIN_CONFIG: GremlinRankingConfig = {
  tagMatchBonus: 0.08,
  relatedRuleBoost: 0.12,
  conflictPenalty: -0.15,
  seedCount: 3,
};

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

/**
 * Check whether Gremlin graph ranking is enabled.
 * Controlled by USE_GREMLIN_RANKING env var (default: "false").
 */
export function isGremlinRankingEnabled(): boolean {
  return process.env.USE_GREMLIN_RANKING === "true";
}

// ---------------------------------------------------------------------------
// Boost computation
// ---------------------------------------------------------------------------

/**
 * Compute a Gremlin-based boost map for the given ranked rules.
 *
 * Steps:
 * 1. Take the top `seedCount` rules as "seed" vertices.
 * 2. For each seed, fetch its tags, related rules, and conflicting rules
 *    from the Gremlin graph.
 * 3. Compute boosts:
 *    - Tag overlap: +tagMatchBonus per shared tag with a seed
 *    - Related: +relatedRuleBoost if a rule is "relates_to" a seed
 *    - Conflicting: +conflictPenalty if a rule "conflicts_with" a seed
 * 4. Return flat BoostMap.
 */
export async function computeGremlinBoosts(
  rankedRules: RankedRule[],
  config: GremlinRankingConfig = DEFAULT_GREMLIN_CONFIG,
): Promise<BoostMap> {
  if (!isGremlinRankingEnabled() || rankedRules.length === 0) {
    return {};
  }

  const boosts: BoostMap = {};

  try {
    // Dynamically import Gremlin client (safe — only called when feature is on)
    const { getGremlinClient } = await import("@jeffdev/db");

    const g = getGremlinClient();

    // 1. Seed rules = top similarity
    const seeds = rankedRules
      .slice()
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, config.seedCount);

    // 2. For each seed, fetch tags, related, and conflicting
    for (const seed of seeds) {
      // Fetch tags for this seed rule
      const seedTags: string[] = await g
        .V(seed.id)
        .outE("tagged_with")
        .inV()
        .values<string>("name")
        .toList()
        .catch(() => [] as string[]);

      if (seedTags.length === 0) continue;

      // Fetch all rules that share at least one tag with the seed
      const taggedRules = (await g
        .V()
        .hasLabel("tag")
        .has("name", P.within(seedTags))
        .inE("tagged_with")
        .outV()
        .hasLabel("rule")
        .dedup()
        .id()
        .toList()
        .catch(() => [] as string[])) as string[];

      // Tag overlap boost
      for (const ruleId of taggedRules) {
        boosts[ruleId] = (boosts[ruleId] || 1) + config.tagMatchBonus;
      }

      // Related rules boost (relates_to edges)
      const relatedIds = (await g
        .V(seed.id)
        .outE("relates_to")
        .inV()
        .id()
        .toList()
        .catch(() => [] as string[])) as string[];

      for (const ruleId of relatedIds) {
        boosts[ruleId] = (boosts[ruleId] || 1) + config.relatedRuleBoost;
      }

      // Conflict penalty
      const conflictIds = (await g
        .V(seed.id)
        .outE("conflicts_with")
        .inV()
        .id()
        .toList()
        .catch(() => [] as string[])) as string[];

      for (const ruleId of conflictIds) {
        boosts[ruleId] = (boosts[ruleId] || 1) + config.conflictPenalty;
      }
    }
  } catch (error) {
    // Gremlin unavailable — silently return no boosts
    console.error(
      "[gremlin-ranking] Gremlin query failed, continuing without graph boosts:",
      error instanceof Error ? error.message : error,
    );
  }

  return boosts;
}

// ---------------------------------------------------------------------------
// Apply boosts to ranked rules
// ---------------------------------------------------------------------------

/**
 * Apply boost multipliers to a list of RankedRules in place.
 * Returns the modified array and a log entry for the safety net.
 */
export function applyGremlinBoosts(
  rules: RankedRule[],
  boosts: BoostMap,
): { rules: RankedRule[]; changedIds: string[] } {
  const changedIds: string[] = [];

  for (const rule of rules) {
    const boost = boosts[rule.id];
    if (boost !== undefined && boost !== 1) {
      rule.similarity = Math.min(1, Math.max(0, rule.similarity * boost));
      changedIds.push(rule.id);
    }
  }

  // Re-sort by new similarity
  rules.sort((a, b) => b.similarity - a.similarity);

  return { rules, changedIds };
}

// ---------------------------------------------------------------------------
// Dual-read safety net logging
// ---------------------------------------------------------------------------

export interface DualReadLogEntry {
  timestamp: string;
  ruleId: string;
  ruleName: string;
  baseSimilarity: number;
  boostedSimilarity: number;
  boostMultiplier: number;
  graphSignals: string[];
}

/**
 * Compare base vs boosted rankings and log discrepancies.
 * Useful for the dual-read safety net (Phase 6.5).
 */
export function logDualReadComparison(
  baseRules: RankedRule[],
  boostedRules: RankedRule[],
): void {
  if (!isGremlinRankingEnabled()) return;

  const baseMap = new Map(baseRules.map((r) => [r.id, r]));
  const boostedMap = new Map(boostedRules.map((r) => [r.id, r]));

  const entries: DualReadLogEntry[] = [];

  // Check rules whose rank changed significantly
  for (const boosted of boostedRules) {
    const base = baseMap.get(boosted.id);
    if (!base) continue;

    const diff = Math.abs(boosted.similarity - base.similarity);
    if (diff > 0.05) {
      entries.push({
        timestamp: new Date().toISOString(),
        ruleId: boosted.id,
        ruleName: boosted.name,
        baseSimilarity: Math.round(base.similarity * 100) / 100,
        boostedSimilarity: Math.round(boosted.similarity * 100) / 100,
        boostMultiplier:
          base.similarity > 0
            ? Math.round((boosted.similarity / base.similarity) * 100) / 100
            : 1,
        graphSignals: [],
      });
    }
  }

  // Check rules present in one set but not the other (appeared/disappeared from top N)
  for (const base of baseRules) {
    if (!boostedMap.has(base.id)) {
      entries.push({
        timestamp: new Date().toISOString(),
        ruleId: base.id,
        ruleName: base.name,
        baseSimilarity: Math.round(base.similarity * 100) / 100,
        boostedSimilarity: 0,
        boostMultiplier: 0,
        graphSignals: ["dropped_from_top_n"],
      });
    }
  }

  if (entries.length > 0) {
    console.error(
      `[gremlin-ranking] Dual-read report: ${entries.length} rules changed by >0.05`,
    );
    for (const entry of entries.slice(0, 10)) {
      console.error(
        `  ${entry.ruleName}: ${entry.baseSimilarity} → ${entry.boostedSimilarity} (×${entry.boostMultiplier})`,
      );
    }
  }
}
