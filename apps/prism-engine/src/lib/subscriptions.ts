/**
 * Subscription Types and Helpers
 */

export type SubscriptionTier = "free" | "pro" | "team" | "enterprise";

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: "active" | "cancelled" | "past_due" | "trialing";
  paypalSubscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TierLimits {
  rules: number;
  components: number;
  projects: number;
  aiGenerations: number; // per month (orchestrate + kitchen + scan + extract)
  codeValidations: number; // per month (check + fix + intercept + drip)
  teamMembers: number;
  ideSync: boolean; // MCP access
  apiKeys: number;
  gitHooks: boolean;
  restGateway: boolean;
  fileExport: boolean; // always true (free feature)
  governanceMemory: boolean;
  ruleCompiler: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  // Free · forever (roadmap v1.0): local enforcement costs us $0, so it is
  // never gated. Unlimited local rules; the cap that remains is on SYNCED
  // artifacts (1 synced project). Small AI quota so the Kitchen is tasteable;
  // 1 API key so `prism pull` works for the synced project.
  // Cost to us: $0 (all local computation)
  free: {
    rules: -1, // unlimited — local rules were never ours to count
    components: -1,
    projects: 1, // the one SYNCED project
    aiGenerations: 25, // taste of the Kitchen (OpenCode free models keep this ~$0)
    codeValidations: -1, // local computation
    teamMembers: 0,
    ideSync: false, // MCP is a paid feature
    apiKeys: 1, // exactly enough for CLI sync of the synced project
    gitHooks: true, // local
    restGateway: false,
    fileExport: true, // always free
    governanceMemory: false,
    ruleCompiler: false,
  },
  // Pro · solo (roadmap v1.0): ₱299/mo (~$8 intl). Unlimited synced projects,
  // full Kitchen, AI rule/skill generation, sandbox preview, cross-machine sync.
  // Cost to us: near $0 on OpenCode free models; embeddings negligible.
  pro: {
    rules: -1,
    components: -1,
    projects: -1,
    aiGenerations: 500,
    codeValidations: -1, // unlimited (free, local)
    teamMembers: 0,
    ideSync: true, // MCP access
    apiKeys: 3,
    gitHooks: true,
    restGateway: true,
    fileExport: true,
    governanceMemory: true,
    ruleCompiler: true,
  },
  // Team (roadmap v1.0): ₱249/seat/mo, min 3 seats. The consistency wedge.
  // Cost to us: ~$7.20/month per team (3x Pro usage)
  team: {
    rules: -1,
    components: -1,
    projects: -1,
    aiGenerations: 2000,
    codeValidations: -1, // unlimited
    teamMembers: 10,
    ideSync: true,
    apiKeys: 10,
    gitHooks: true,
    restGateway: true,
    fileExport: true,
    governanceMemory: true,
    ruleCompiler: true,
  },
  // Enterprise: everything unlimited, on-prem zero egress
  enterprise: {
    rules: -1,
    components: -1,
    projects: -1,
    aiGenerations: -1,
    codeValidations: -1,
    teamMembers: -1,
    ideSync: true,
    apiKeys: -1,
    gitHooks: true,
    restGateway: true,
    fileExport: true,
    governanceMemory: true,
    ruleCompiler: true,
  },
};

/** Team plan bills per seat; fewer than this many seats cannot check out. */
export const TEAM_MIN_SEATS = 3;

export const TIER_PRICES = {
  // Pro · solo: ₱299/mo ≈ $8 intl (regional pricing is the mechanism, not a
  // discount). Annual = 10× monthly (2 months free).
  // Includes: unlimited synced projects, Kitchen, 500 AI generations, MCP sync
  pro: {
    monthly: { php: 299, usd: 8 },
    annual: { php: 2990, usd: 80 },
  },
  // Team: ₱249/seat/mo ≈ $7 intl, minimum 3 seats. Annual = 10× monthly.
  // Includes: everything in Pro + 2000 AI gen, 10 members, shared constitution
  team: {
    monthly: { php: 249, usd: 7 },
    annual: { php: 2490, usd: 70 },
  },
  // Enterprise: custom annual pricing
  enterprise: {
    monthly: { php: null, usd: null },
    annual: { php: null, usd: null },
  },
};

export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits,
  currentUsage: number = 0,
): boolean {
  const limit = TIER_LIMITS[tier][feature];

  if (typeof limit === "boolean") {
    return limit;
  }

  if (limit === -1) {
    return true; // unlimited
  }

  return currentUsage < limit;
}

/**
 * Check if a tier can use a specific MCP tool.
 * Gates AI-powered tools behind paid tiers, free tools are always accessible.
 */
export function canUseMcpTool(tier: SubscriptionTier, toolName: string): boolean {
  const limits = TIER_LIMITS[tier];

  // MCP access required for all tools except file export
  if (!limits.ideSync && toolName !== "file_export") {
    return false;
  }

  // AI-powered tools (cost us money)
  const aiTools = ["prism_orchestrate", "prism_kitchen", "prism_scan", "repo_extract"];
  if (aiTools.includes(toolName)) {
    return limits.aiGenerations !== 0;
  }

  // Governance tools (free, local computation)
  const governanceTools = [
    "prism_check", "prism_fix", "prism_intercept", "prism_drip",
    "prism_compile", "prism_memory", "validate_code_pattern",
    "get_architectural_rules", "get_skill", "list_skills", "repo_scan",
  ];
  if (governanceTools.includes(toolName)) {
    return limits.codeValidations !== 0;
  }

  // Always allowed
  return true;
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: "Free",
    pro: "Pro",
    team: "Team",
    enterprise: "Enterprise",
  };
  return names[tier];
}

/**
 * Get a user's subscription tier from the database.
 * Returns "free" if no active subscription is found.
 * Filters by status to prevent cancelled/past_due subscriptions from granting access.
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const { getPrismDb } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();
    const { data: sub } = await db
      .from("prism_subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    return (sub?.tier as SubscriptionTier) || "free";
  } catch {
    return "free";
  }
}

export interface ProjectCapResult {
  allowed: boolean;
  tier: SubscriptionTier;
  /** Max projects for this tier; -1 means unlimited. */
  limit: number;
  /**
   * Current project count. -1 when the tier is unlimited and the count
   * query was skipped (there is nothing to enforce against).
   */
  currentCount: number;
}

/**
 * Enforce the per-tier project cap at CREATE time only.
 *
 * Grandfathering contract: existing rows are never touched, hidden, or
 * migrated — a user over their cap (e.g. downgraded from Pro with 3 projects
 * on Free's 1-project limit) keeps full access to what exists and simply
 * cannot create another until they delete down under the cap or upgrade.
 *
 * Tier source of truth is prism_subscriptions.tier via getUserTier() — NOT
 * user_profiles.tier, which admin overrides write to while having no effect
 * on enforcement (known Phase 1 bug).
 */
export async function assertWithinProjectCap(
  userId: string,
): Promise<ProjectCapResult> {
  const tier = await getUserTier(userId);
  const limit = TIER_LIMITS[tier].projects;

  if (limit === -1) {
    return { allowed: true, tier, limit, currentCount: -1 };
  }

  try {
    const { getPrismDb } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();
    const { count } = await db
      .from("prism_projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const currentCount = count ?? 0;
    return { allowed: currentCount < limit, tier, limit, currentCount };
  } catch {
    // Fail open on infrastructure errors — an outage must not lock users
    // out of creating projects (same philosophy as the Pass hook).
    return { allowed: true, tier, limit, currentCount: -1 };
  }
}

/** Human-facing rejection message for a failed project-cap check. */
export function projectCapMessage(cap: ProjectCapResult): string {
  const plan = getTierDisplayName(cap.tier);
  return `Your ${plan} plan includes ${cap.limit} project${cap.limit === 1 ? "" : "s"} — you currently have ${cap.currentCount}. Delete a project or upgrade to add more.`;
}
