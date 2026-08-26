import { logError } from "@/lib/log-error";
/**
 * API Keys Management
 *
 * GET  /api/api-keys - List user's API keys (masked)
 * POST /api/api-keys - Generate new API key
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";
import crypto from "crypto";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a secure API key with Stripe-style format
 */
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(24).toString("base64url");
  const key = `pk_live_${randomBytes}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 12); // "pk_live_xxxx"
  return { key, hash, prefix };
}

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

/**
 * Generate unique ID for new API key
 */
function generateId(): string {
  return `key_${crypto.randomBytes(12).toString("hex")}`;
}

// =============================================================================
// GET - List API Keys
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
    const tier = await getUserTier(userId);
    const db = getPrismDb();

    // Fetch non-revoked keys for this user
    const { data: keys } = await db
      .from("prism_api_keys")
      .select(
        "id, name, keyPrefix:key_prefix, lastUsedAt:last_used_at, createdAt:created_at",
      )
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    const maskedKeys = keys ?? [];

    return NextResponse.json({
      keys: maskedKeys,
      tier,
      limit: TIER_LIMITS[tier].apiKeys,
      canCreate:
        TIER_LIMITS[tier].apiKeys === -1 ||
        maskedKeys.length < TIER_LIMITS[tier].apiKeys,
    });
  } catch (error) {
    logError("app/api/api-keys/route", "[API Keys] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

// =============================================================================
// POST - Generate New API Key
// =============================================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    const body = await request.json();
    const { name } = body as { name: string };

    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "Name is required and must be 50 characters or less" },
        { status: 400 },
      );
    }

    // Check tier limits
    const tier = await getUserTier(userId);
    const keyLimit = TIER_LIMITS[tier].apiKeys;

    if (keyLimit === 0) {
      return NextResponse.json(
        {
          error:
            "API keys are not available on your current plan. Please upgrade to Pro or higher.",
        },
        { status: 403 },
      );
    }

    const db = getPrismDb();

    // Count existing non-revoked keys
    const { count: existingCount } = await db
      .from("prism_api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("revoked_at", null);

    if (keyLimit !== -1 && (existingCount ?? 0) >= keyLimit) {
      return NextResponse.json(
        {
          error: `You have reached your limit of ${keyLimit} API key(s). Revoke an existing key or upgrade your plan.`,
        },
        { status: 403 },
      );
    }

    // Generate new key
    const { key, hash, prefix } = generateApiKey();
    const id = generateId();
    const now = new Date().toISOString();

    await db.from("prism_api_keys").insert({
      id,
      user_id: userId,
      key_hash: hash,
      key_prefix: prefix,
      name,
      created_at: now,
    });

    // Return the full key ONCE - it will never be shown again
    return NextResponse.json({
      id,
      name,
      key, // Full key - only shown once!
      keyPrefix: prefix,
      createdAt: now,
      message: "Copy this key now. It will not be shown again.",
    });
  } catch (error) {
    logError("app/api/api-keys/route", "[API Keys] POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 },
    );
  }
}
