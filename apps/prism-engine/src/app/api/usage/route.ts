/**
 * Usage API
 *
 * GET /api/usage - Get user's current usage stats and limits
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@syntaxure-labs/db";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

// =============================================================================
// HELPERS
// =============================================================================

async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const subscriptionsCollection = await getCollection("subscriptions");
    const subscription = await subscriptionsCollection.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
    });

    if (!subscription) {
      return "free";
    }

    return (subscription.tier as SubscriptionTier) || "free";
  } catch {
    return "free";
  }
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

// =============================================================================
// GET - Usage Stats
// =============================================================================

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Get user's tier
    const tier = await getUserTier(userId);
    const limits = TIER_LIMITS[tier];

    // Get collections
    const [
      projectsCollection,
      rulesCollection,
      componentsCollection,
      generationsCollection,
    ] = await Promise.all([
      getCollection("projects"),
      getCollection("rules"),
      getCollection("components"),
      getCollection("generations"),
    ]);

    // Count usage
    const monthStart = getMonthStart();

    const [projectCount, ruleCount, componentCount, generationCount] =
      await Promise.all([
        projectsCollection.countDocuments({ userId }),
        rulesCollection.countDocuments({ createdBy: userId }),
        componentsCollection.countDocuments({ userId }),
        generationsCollection.countDocuments({
          userId,
          createdAt: { $gte: monthStart.toISOString() },
        }),
      ]);

    // Build response
    const formatLimit = (limit: number) => (limit === -1 ? "unlimited" : limit);

    return NextResponse.json({
      tier,
      usage: {
        projects: {
          used: projectCount,
          limit: formatLimit(limits.projects),
        },
        rules: {
          used: ruleCount,
          limit: formatLimit(limits.rules),
        },
        components: {
          used: componentCount,
          limit: formatLimit(limits.components),
        },
        aiGenerations: {
          used: generationCount,
          limit: formatLimit(limits.aiGenerations),
        },
      },
      resetDate: getNextMonthStart().toISOString(),
    });
  } catch (error) {
    console.error("[Usage] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage stats" },
      { status: 500 },
    );
  }
}
