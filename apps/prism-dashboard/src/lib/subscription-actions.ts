"use server";

import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * Get user's current subscription tier
 */
export async function getUserTier(): Promise<SubscriptionTier> {
  const { userId } = await auth();
  
  if (!userId) {
    return "free";
  }

  try {
    const subscriptionsCollection = await getCollection("subscriptions");
    const subscription = await subscriptionsCollection.findOne({ 
      userId,
      status: { $in: ["active", "trialing"] }
    });

    if (!subscription) {
      return "free";
    }

    return (subscription.tier as SubscriptionTier) || "free";
  } catch {
    return "free";
  }
}

/**
 * Check if user can use IDE sync features (Pro+ only)
 */
export async function canUseIdeSync(): Promise<{ allowed: boolean; tier: SubscriptionTier }> {
  const tier = await getUserTier();
  const allowed = TIER_LIMITS[tier].ideSync;
  return { allowed, tier };
}

/**
 * Get user's usage stats
 */
export async function getUsageStats(userId: string) {
  const projectsCollection = await getCollection("projects");
  const rulesCollection = await getCollection("rules");
  
  const [projectCount, ruleCount] = await Promise.all([
    projectsCollection.countDocuments({ userId }),
    rulesCollection.countDocuments({ userId }),
  ]);

  return { projectCount, ruleCount };
}
