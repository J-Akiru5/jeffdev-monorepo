import { logError } from "@/lib/log-error";
import { createClient } from "@/lib/supabase/server";
import { verifyBearerJwt } from "@/lib/api-auth";
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
 *
 * Two verification paths:
 *   - Authorization: Bearer <jwt>  -> CLI/session-token path. The JWT is
 *     verified directly against Supabase's auth server via an anon-key
 *     client (getUser(jwt) overload). No cookies involved — this is what
 *     makes `prism login --token <token>` work from any machine.
 *   - no header                    -> browser session path (cookie-bound
 *     SSR client, unchanged).
 */

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]!.trim() : null;
}

export async function GET(request: Request) {
  try {
    const jwt = bearerToken(request);

    // 1. Get auth from Supabase — bearer token when present, cookies otherwise
    let user: { id: string } | null = null;
    if (jwt) {
      user = await verifyBearerJwt(jwt);
    } else {
      const supabase = await createClient();
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      user = sessionUser;
    }

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