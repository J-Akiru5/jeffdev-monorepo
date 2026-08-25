"use server";

import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import {
  TIER_LIMITS,
  getUserTier as getTierForUser,
  type SubscriptionTier,
} from "@/lib/subscriptions";

/**
 * Get user's current subscription tier.
 * Thin session wrapper over the canonical getUserTier() in lib/subscriptions
 * so tier resolution has exactly one implementation (billing source of truth).
 */
export async function getUserTier(): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "free";
  }

  return getTierForUser(user.id);
}

/**
 * Check if user can use IDE sync features (Pro+ only)
 */
export async function canUseIdeSync(): Promise<{
  allowed: boolean;
  tier: SubscriptionTier;
}> {
  const tier = await getUserTier();
  const allowed = TIER_LIMITS[tier].ideSync;
  return { allowed, tier };
}

/**
 * Get user's usage stats
 */
export async function getUsageStats(userId: string) {
  const db = getPrismDb();
  const [{ count: projectCount }, { count: ruleCount }] = await Promise.all([
    db
      .from("prism_projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    db
      .from("prism_rules")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId),
  ]);

  return { projectCount: projectCount || 0, ruleCount: ruleCount || 0 };
}
