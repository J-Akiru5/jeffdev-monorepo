import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  TIER_LIMITS,
  canUseFeature,
  getTierDisplayName,
  type SubscriptionTier,
} from "@/lib/subscriptions";

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
    expect(free.rules).toBe(10);
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
    expect(TIER_LIMITS.pro.projects).toBe(5);
    expect(TIER_LIMITS.pro.rules).toBe(100);
    expect(TIER_LIMITS.pro.components).toBe(50);
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
    expect(canUseFeature("enterprise", "rules", 9999)).toBe(true);
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

// ---------------------------------------------------------------------------
// assertWithinProjectCap (Phase 0 project-cap enforcement)
//
// getUserTier() reads prism_subscriptions via getPrismDb(); the cap check
// counts prism_projects. Both go through one fake Supabase client whose
// chain shape matches only what these functions actually call.
// ---------------------------------------------------------------------------

const state = vi.hoisted(() => ({ db: null as null | Record<string, unknown> }));

vi.mock("@syntaxure-labs/db/prism", () => ({
  getPrismDb: () => state.db,
}));

function makeFakeDb(opts: {
  sub?: { tier: string } | null;
  projectCount?: number;
  failCount?: boolean;
}) {
  return {
    from(table: string) {
      if (table === "prism_subscriptions") {
        const q = {} as Record<string, unknown> & {
          select: () => unknown;
          eq: () => unknown;
          in: () => unknown;
        };
        q.select = () => q;
        q.eq = () => q;
        q.in =
          () =>
          ({ maybeSingle: () => Promise.resolve({ data: opts.sub ?? null }) });
        return q;
      }
      if (table === "prism_projects") {
        const q = {} as Record<string, unknown> & { select: () => unknown; eq: () => unknown };
        q.select =
          () =>
          ({
            eq: () => {
              if (opts.failCount) return Promise.reject(new Error("db down"));
              return Promise.resolve({ count: opts.projectCount ?? 0, error: null });
            },
          });
        return q;
      }
      throw new Error(`unexpected table: ${table}`);
    },
  };
}

describe("assertWithinProjectCap", () => {
  beforeAll(() => {
    vi.restoreAllMocks();
  });

  it("allows a free user under the cap (0 of 1)", async () => {
    state.db = makeFakeDb({ sub: null, projectCount: 0 }) as never;
    const { assertWithinProjectCap } = await import("@/lib/subscriptions");
    const cap = await assertWithinProjectCap("user-1");
    expect(cap).toEqual({
      allowed: true,
      tier: "free",
      limit: 1,
      currentCount: 0,
    });
  });

  it("blocks a free user at the cap and reports grandfathered counts", async () => {
    // Jeff's exact demo situation: 2 existing projects on Free's 1-project limit.
    // Enforcement must block NEW creates while both existing rows stay intact.
    state.db = makeFakeDb({ sub: null, projectCount: 2 }) as never;
    const { assertWithinProjectCap } = await import("@/lib/subscriptions");
    const cap = await assertWithinProjectCap("user-1");
    expect(cap.allowed).toBe(false);
    expect(cap.tier).toBe("free");
    expect(cap.limit).toBe(1);
    expect(cap.currentCount).toBe(2);
  });

  it("blocks a pro user at 5 of 5, allows at 4 of 5", async () => {
    state.db = makeFakeDb({ sub: { tier: "pro" }, projectCount: 5 }) as never;
    const mod = await import("@/lib/subscriptions");
    expect((await mod.assertWithinProjectCap("user-1")).allowed).toBe(false);

    state.db = makeFakeDb({ sub: { tier: "pro" }, projectCount: 4 }) as never;
    const cap = await mod.assertWithinProjectCap("user-1");
    expect(cap.allowed).toBe(true);
    expect(cap.currentCount).toBe(4);
  });

  it("skips the COUNT query entirely on unlimited tiers (-1)", async () => {
    const tables: string[] = [];
    const base = makeFakeDb({ sub: { tier: "enterprise" }, projectCount: 99 });
    state.db = {
      from: (table: string) => {
        tables.push(table);
        return (
          base as unknown as { from: (t: string) => unknown }
        ).from(table);
      },
    } as never;
    const { assertWithinProjectCap } = await import("@/lib/subscriptions");
    const cap = await assertWithinProjectCap("user-1");
    expect(cap.allowed).toBe(true);
    expect(cap.limit).toBe(-1);
    expect(cap.currentCount).toBe(-1);
    expect(tables).not.toContain("prism_projects");
  });

  it("fails open when the count query errors (infra outage must not lock users out)", async () => {
    state.db = makeFakeDb({ sub: null, projectCount: 0, failCount: true }) as never;
    const { assertWithinProjectCap } = await import("@/lib/subscriptions");
    const cap = await assertWithinProjectCap("user-1");
    expect(cap.allowed).toBe(true);
  });

  it("reads tier from prism_subscriptions only (never user_profiles)", async () => {
    state.db = makeFakeDb({ sub: { tier: "pro" }, projectCount: 5 }) as never;
    const { assertWithinProjectCap } = await import("@/lib/subscriptions");
    const cap = await assertWithinProjectCap("user-1");
    expect(cap.tier).toBe("pro");
  });
});

describe("projectCapMessage", () => {
  it("uses singular for a 1-project plan and names the way out", async () => {
    state.db = makeFakeDb({ sub: null, projectCount: 2 }) as never;
    const mod = await import("@/lib/subscriptions");
    const msg = mod.projectCapMessage(await mod.assertWithinProjectCap("u"));
    expect(msg).toContain("Free plan includes 1 project —");
    expect(msg).toContain("you currently have 2");
    expect(msg.toLowerCase()).toContain("upgrade");
    expect(msg).not.toContain("projects —"); // no plural slip
  });
});
