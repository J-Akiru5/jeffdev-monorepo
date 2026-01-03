import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { NextRequest, NextResponse } from "next/server";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * Auth Verify API
 * 
 * Verifies a session token and returns user info + subscription tier.
 * Used by prism-cli to authenticate and check IDE sync access.
 * 
 * GET /api/auth/verify
 * Authorization: Bearer <clerk-session-token>
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Get auth from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid or expired token",
          tier: "free",
          ideSync: false,
          userId: ""
        },
        { status: 401 }
      );
    }

    // 2. Get subscription tier
    const tier = await getUserTier(userId);
    const ideSync = TIER_LIMITS[tier].ideSync;

    return NextResponse.json({
      success: true,
      userId,
      tier,
      ideSync,
      limits: TIER_LIMITS[tier],
      upgradeUrl: ideSync ? undefined : "/subscription",
    });

  } catch (error) {
    console.error("[Auth Verify] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Verification failed",
        tier: "free",
        ideSync: false,
        userId: ""
      },
      { status: 500 }
    );
  }
}

/**
 * Get user's subscription tier
 */
async function getUserTier(userId: string): Promise<SubscriptionTier> {
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
