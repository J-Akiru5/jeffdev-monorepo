/**
 * API Key Verification (for MCP Server)
 *
 * POST /api/api-keys/verify - Validate an API key and return user info
 *
 * This endpoint is called by the MCP server to authenticate requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";
import crypto from "crypto";

/**
 * Get user's subscription tier from database
 */
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body as { apiKey: string };

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: "API key is required" },
        { status: 400 },
      );
    }

    // Validate key format
    if (!apiKey.startsWith("pk_live_")) {
      return NextResponse.json(
        { valid: false, error: "Invalid API key format" },
        { status: 401 },
      );
    }

    // Hash the provided key to compare with stored hash
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const db = getPrismDb();

    // Find key by hash
    const { data: keyDoc } = await db
      .from("prism_api_keys")
      .select("userId:user_id, name")
      .eq("key_hash", keyHash)
      .is("revoked_at", null)
      .maybeSingle();

    if (!keyDoc) {
      return NextResponse.json(
        { valid: false, error: "Invalid or revoked API key" },
        { status: 401 },
      );
    }

    // Update last used timestamp
    await db
      .from("prism_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash);

    // Get user's tier
    const tier = await getUserTier(keyDoc.userId);
    const limits = TIER_LIMITS[tier];

    // Check if tier allows IDE sync (MCP access)
    if (!limits.ideSync) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Your subscription tier does not include MCP access. Please upgrade to Pro or higher.",
          upgradeUrl: "/subscription",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      valid: true,
      userId: keyDoc.userId,
      keyName: keyDoc.name,
      tier,
      limits: {
        rules: limits.rules,
        components: limits.components,
        aiGenerations: limits.aiGenerations,
      },
    });
  } catch (error) {
    console.error("[API Keys] Verify error:", error);
    return NextResponse.json(
      { valid: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
