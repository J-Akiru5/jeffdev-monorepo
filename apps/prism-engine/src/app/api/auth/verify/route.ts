import { logError } from "@/lib/log-error";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { TIER_LIMITS, getUserTier } from "@/lib/subscriptions";

/**
 * Auth Verify API
 *
 * Verifies a session token and returns user info + subscription tier.
 * Used by prism-cli to authenticate and check IDE sync access.
 *
 * GET /api/auth/verify
 * Authorization: Bearer <supabase-session-token>
 */

export async function GET() {
  try {
    // 1. Get auth from Supabase
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
          tier: "free",
          ideSync: false,
          userId: "",
        },
        { status: 401 },
      );
    }

    const userId = user.id;

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
    logError("app/api/auth/verify/route", "[Auth Verify] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Verification failed",
        tier: "free",
        ideSync: false,
        userId: "",
      },
      { status: 500 },
    );
  }
}
