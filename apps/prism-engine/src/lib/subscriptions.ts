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
  // Free: taste the governance layer, no MCP access
  // Cost to us: $0 (all local computation)
  free: {
    rules: 10,
    components: 5,
    projects: 1,
    aiGenerations: 0, // no AI features
    codeValidations: 50, // limited check/fix (free, local computation)
    teamMembers: 0,
    ideSync: false, // no MCP
    apiKeys: 0,
    gitHooks: false,
    restGateway: false,
    fileExport: true, // always free
    governanceMemory: false,
    ruleCompiler: false,
  },
  // Pro: individual developers, full governance
  // Cost to us: ~$2.40/month per user (embeddings + occasional chat)
  pro: {
    rules: 100,
    components: 50,
    projects: 5,
    aiGenerations: 500, // ~$0.30/month in AI costs
    codeValidations: -1, // unlimited (free, local)
    teamMembers: 0,
    ideSync: true, // MCP access
    apiKeys: 2,
    gitHooks: true,
    restGateway: true,
    fileExport: true,
    governanceMemory: true,
    ruleCompiler: true,
  },
  // Team: small teams, collaboration
  // Cost to us: ~$7.20/month per team (3x Pro usage)
  team: {
    rules: -1, // unlimited
    components: -1,
    projects: -1,
    aiGenerations: 2000, // ~$1.20/month in AI costs
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
  // Enterprise: everything unlimited
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

export const TIER_PRICES = {
  // Pro: $12/mo (cost to us: ~$2.40, margin: 80%)
  // Includes: MCP access, 500 AI generations, unlimited validations, git hooks
  pro: {
    monthly: { php: 660, usd: 12 },
    annual: { php: 6600, usd: 120 },
  },
  // Team: $36/mo (cost to us: ~$7.20, margin: 80%)
  // Includes: everything in Pro + 2000 AI gen, 10 members, unlimited rules
  team: {
    monthly: { php: 1980, usd: 36 },
    annual: { php: 19800, usd: 360 },
  },
  // Enterprise: custom pricing
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
    const { getCollection } = await import("@syntaxure-labs/db/cosmos");
    const subscriptions = await getCollection("subscriptions");
    const sub = await subscriptions.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
    });
    return (sub?.tier as SubscriptionTier) || "free";
  } catch {
    return "free";
  }
}
