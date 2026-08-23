/**
 * Usage API
 *
 * GET /api/usage - Get user's current usage stats and limits
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

// =============================================================================
// HELPERS
// =============================================================================

async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const db = getPrismDb();
    const { data: subscription } = await db
      .from("prism_subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

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

    const db = getPrismDb();
    const countOpts = { count: "exact" as const, head: true };

    // Count usage
    const monthStart = getMonthStart();

    const [
      { count: projectCount },
      { count: ruleCount },
      { count: componentCount },
      { count: generationCount },
    ] = await Promise.all([
      db.from("prism_projects").select("id", countOpts).eq("user_id", userId),
      db.from("prism_rules").select("id", countOpts).eq("created_by", userId),
      db.from("prism_components").select("id", countOpts).eq("user_id", userId),
      db
        .from("prism_generations")
        .select("id", countOpts)
        .eq("user_id", userId)
        .gte("created_at", monthStart.toISOString()),
    ]);

    // Build response
    const formatLimit = (limit: number) => (limit === -1 ? "unlimited" : limit);

    return NextResponse.json({
      tier,
      usage: {
        projects: {
          used: projectCount ?? 0,
          limit: formatLimit(limits.projects),
        },
        rules: {
          used: ruleCount ?? 0,
          limit: formatLimit(limits.rules),
        },
        components: {
          used: componentCount ?? 0,
          limit: formatLimit(limits.components),
        },
        aiGenerations: {
          used: generationCount ?? 0,
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
