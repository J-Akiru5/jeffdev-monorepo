import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  agents,
  allCopyStrings,
  blockOutput,
  claims,
  findBannedPhrase,
  hero,
  pricing,
  publishedClaims,
  retiredClaims,
  sectionIds,
  tierLabels,
  verbatimArtefacts,
} from "./content";

/**
 * The page's credibility rests on two invariants that are easy to break by
 * accident while editing copy: a claim without a source, and a phrase that
 * promises more than the code delivers. Both are enforced here rather than in
 * a review comment.
 */

const PRICING_SOURCE = "../../lib/pricing-db.ts";

interface SourcePlan {
  name: string;
  tagline: string;
  monthlyUsd: number | null;
}

/** Reads FALLBACK_PLANS straight out of the pricing module, without importing
 *  it — importing would pull the Supabase admin client into the test. */
function readFallbackPlans(): SourcePlan[] {
  const path = fileURLToPath(new URL(PRICING_SOURCE, import.meta.url));
  const source = readFileSync(path, "utf8");

  const start = source.indexOf("const FALLBACK_PLANS");
  const end = source.indexOf("const FALLBACK_COMPARISON");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const block = source.slice(start, end);

  const plans: SourcePlan[] = [];
  const planRe =
    /name:\s*"([^"]+)",\s*tagline:\s*"([^"]+)",[\s\S]*?price:\s*\{\s*monthly:\s*(null|\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = planRe.exec(block)) !== null) {
    const [, name, tagline, monthly] = match;
    plans.push({
      name: name!,
      tagline: tagline!,
      monthlyUsd: monthly === "null" ? null : Number(monthly),
    });
  }
  return plans;
}

describe("claim ledger", () => {
  it("gives every published claim a status and a source", () => {
    expect(publishedClaims.length).toBeGreaterThan(0);
    for (const claim of publishedClaims) {
      expect(claim.status, claim.id).toBeTruthy();
      expect(claim.source.length, claim.id).toBeGreaterThan(0);
    }
  });

  it("never publishes an unverified or unsupported claim", () => {
    for (const claim of publishedClaims) {
      expect(["VERIFIED", "STATED"], claim.id).toContain(claim.status);
    }
  });

  it("keeps every retired claim out of the published set", () => {
    for (const claim of retiredClaims) {
      expect(claim.published, claim.id).toBe(false);
    }
    const publishedIds = new Set(publishedClaims.map((c) => c.id));
    for (const claim of retiredClaims) {
      expect(publishedIds.has(claim.id), claim.id).toBe(false);
    }
  });

  it("does not let a claim be both published and retired", () => {
    const all = [...claims, ...retiredClaims];
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("copy language", () => {
  it("contains no banned marketing phrase", () => {
    for (const text of allCopyStrings()) {
      const hit = findBannedPhrase(text);
      expect(hit, `banned phrase "${hit}" in: ${text}`).toBeNull();
    }
  });

  it("detects a banned phrase when one is present", () => {
    expect(findBannedPhrase("Trusted by 500 developers")).toBe("trusted by");
    expect(findBannedPhrase("a 10x improvement")).toBe("10x");
    expect(findBannedPhrase("A write that never reached disk.")).toBeNull();
  });

  /**
   * House rule: prose uses commas, colons and parentheses, never an em dash.
   *
   * The exemption list is the point of this test. Real CLI output genuinely
   * contains em dashes, and "tidying" the terminal demo to match the style guide
   * would turn the page's strongest evidence into a fabrication — so the rule is
   * enforced everywhere except a named, reviewed set, and the second test below
   * makes sure that set is still intact.
   */
  it("uses no em dash outside byte-exact CLI output", () => {
    const exempt = new Set(verbatimArtefacts);
    for (const text of allCopyStrings()) {
      if (exempt.has(text)) continue;
      expect(text.includes("—"), `em dash in: ${text}`).toBe(false);
    }
    expect(verbatimArtefacts.length).toBeGreaterThan(0);
  });

  it("keeps the em dashes that belong to the real CLI output", () => {
    for (const artefact of verbatimArtefacts) {
      expect(artefact.includes("—"), artefact.slice(0, 40)).toBe(true);
    }
  });
});

describe("block output contract", () => {
  /**
   * Byte-exact reproduction of formatHookClaudeCode(). If someone reflows the
   * terminal demo for looks, this fails — the demo's credibility is that it is
   * the literal output.
   */
  it("matches the published Claude Code hook format exactly", () => {
    expect(blockOutput).toBe(
      "PRISM PASS blocked write to PrimaryButton.tsx — 1 rule violation must be fixed now:\n" +
        "1. Line 12 (styling/no-hex): replace '#06b6d4' with 'var(--brand-primary)' — Use the design token.\n" +
        "Apply exactly these edits to PrimaryButton.tsx, then continue your original task.",
    );
  });

  it("does not claim the write was prevented before disk", () => {
    expect(blockOutput.toLowerCase()).not.toContain("before it reaches disk");
  });
});

describe("agent coverage", () => {
  it("assigns every agent a tier with a human label", () => {
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(tierLabels[agent.tier], agent.name).toBeTruthy();
      expect(agent.detail.length, agent.name).toBeGreaterThan(0);
    }
  });

  it("only marks Claude Code as enforcing", () => {
    const enforcing = agents.filter((a) => a.tier === "enforcing").map((a) => a.name);
    expect(enforcing).toEqual(["Claude Code"]);
  });

  it("flags unverified agents as config-only rather than enforcing", () => {
    for (const name of ["Cursor", "Antigravity"]) {
      const agent = agents.find((a) => a.name === name);
      expect(agent?.tier, name).toBe("config-only");
      expect(agent?.detail.toLowerCase()).toContain("unverified");
    }
  });
});

describe("hero", () => {
  it("installs the package that is actually published", () => {
    expect(hero.command).toBe("npx @prism-engine/cli init");
  });

  it("states the mechanism rather than asserting pre-disk prevention", () => {
    expect(hero.mechanism).toContain("PostToolUse");
    expect(hero.subhead.toLowerCase()).not.toContain("before it reaches disk");
    expect(hero.subhead.toLowerCase()).not.toContain("never reached disk");
  });
});

describe("in-page anchors", () => {
  /**
   * A `#section` link that matches no rendered id is a dead link, and a dead
   * link in front of a judge is worse than no link. Every hash in the copy is
   * checked against the ids the sections actually render.
   */
  it("points every hash link at a section id that exists", () => {
    const rendered = new Set<string>(Object.values(sectionIds));
    const hashes = allCopyStrings().filter((s) => s.startsWith("#"));

    expect(hashes.length).toBeGreaterThan(0);
    for (const hash of hashes) {
      expect(rendered.has(hash.slice(1)), hash).toBe(true);
    }
  });

  it("declares a section id for every section on the page", () => {
    const ids = Object.values(sectionIds);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("pricing matches the pricing source of truth", () => {
  it("reads the same names, taglines and monthly prices", () => {
    const sourcePlans = readFallbackPlans();
    expect(sourcePlans.map((p) => p.name)).toEqual(pricing.map((p) => p.name));
    expect(sourcePlans.map((p) => p.tagline)).toEqual(pricing.map((p) => p.tagline));
    expect(sourcePlans.map((p) => p.monthlyUsd)).toEqual(pricing.map((p) => p.monthlyUsd));
  });

  it("does not advertise the retired $18 / $54 prices", () => {
    const monthly = pricing.map((p) => p.monthlyUsd);
    expect(monthly).toContain(8);
    expect(monthly).not.toContain(18);
    expect(monthly).not.toContain(54);
  });
});
