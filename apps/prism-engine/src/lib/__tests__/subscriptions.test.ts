import { describe, it, expect } from "vitest";
import { TIER_LIMITS, canUseFeature, getTierDisplayName, type SubscriptionTier } from "@/lib/subscriptions";

describe("TIER_LIMITS", () => {
  it("defines limits for all tiers", () => {
    const tiers: SubscriptionTier[] = ["free", "pro", "team", "enterprise"];
    for (const tier of tiers) {
      expect(TIER_LIMITS[tier]).toBeDefined();
      expect(TIER_LIMITS[tier].projects).toBeDefined();
      expect(TIER_LIMITS[tier].rules).toBeDefined();
      expect(TIER_LIMITS[tier].apiKeys).toBeDefined();
    }
  });

  it("free tier has the lowest limits", () => {
    const free = TIER_LIMITS.free;
    expect(free.projects).toBe(1);
    expect(free.rules).toBe(5);
    expect(free.components).toBe(5);
  });

  it("enterprise tier has unlimited everything", () => {
    const enterprise = TIER_LIMITS.enterprise;
    expect(enterprise.projects).toBe(-1);
    expect(enterprise.rules).toBe(-1);
    expect(enterprise.components).toBe(-1);
    expect(enterprise.aiGenerations).toBe(-1);
    expect(enterprise.teamMembers).toBe(-1);
    expect(enterprise.apiKeys).toBe(-1);
  });

  it("pro tier allows at least 5 projects", () => {
    expect(TIER_LIMITS.pro.projects).toBe(10);
    expect(TIER_LIMITS.pro.rules).toBe(-1);
    expect(TIER_LIMITS.pro.components).toBe(-1);
  });

  it("team tier allows 10 team members", () => {
    expect(TIER_LIMITS.team.teamMembers).toBe(10);
  });

  it("free tier has no IDE sync", () => {
    expect(TIER_LIMITS.free.ideSync).toBe(false);
  });

  it("pro+ tiers have IDE sync enabled", () => {
    expect(TIER_LIMITS.pro.ideSync).toBe(true);
    expect(TIER_LIMITS.team.ideSync).toBe(true);
    expect(TIER_LIMITS.enterprise.ideSync).toBe(true);
  });
});

describe("canUseFeature", () => {
  it("allows usage within limits", () => {
    expect(canUseFeature("free", "projects", 0)).toBe(true);
    expect(canUseFeature("free", "projects", 0)).toBe(true);
  });

  it("blocks usage when limit exceeded", () => {
    expect(canUseFeature("free", "projects", 1)).toBe(false);
  });

  it("allows unlimited tiers regardless of usage", () => {
    expect(canUseFeature("pro", "rules", 9999)).toBe(true);
    expect(canUseFeature("enterprise", "projects", 9999)).toBe(true);
  });

  it("handles boolean features correctly", () => {
    expect(canUseFeature("free", "ideSync")).toBe(false);
    expect(canUseFeature("pro", "ideSync")).toBe(true);
  });
});

describe("getTierDisplayName", () => {
  it("returns human-readable names", () => {
    expect(getTierDisplayName("free")).toBe("Free");
    expect(getTierDisplayName("pro")).toBe("Pro");
    expect(getTierDisplayName("team")).toBe("Team");
    expect(getTierDisplayName("enterprise")).toBe("Enterprise");
  });
});

describe("Pricing display", () => {
  it("tier slugs match expected format", () => {
    const slugs = Object.keys(TIER_LIMITS);
    expect(slugs).toEqual(["free", "pro", "team", "enterprise"]);
  });
});
