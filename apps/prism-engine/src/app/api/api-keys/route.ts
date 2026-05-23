/**
 * API Keys Management
 *
 * GET  /api/api-keys - List user's API keys (masked)
 * POST /api/api-keys - Generate new API key
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@jeffdev/db";
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
    const apiKeysCollection = await getCollection("apiKeys");

    // Fetch non-revoked keys for this user
    const keys = await apiKeysCollection
      .find({ userId, revokedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .toArray();

    // Mask the keys (only show prefix + last 4 chars of hash for identification)
    const maskedKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    }));

    return NextResponse.json({
      keys: maskedKeys,
      tier,
      limit: TIER_LIMITS[tier].apiKeys,
      canCreate:
        TIER_LIMITS[tier].apiKeys === -1 ||
        maskedKeys.length < TIER_LIMITS[tier].apiKeys,
    });
  } catch (error) {
    console.error("[API Keys] GET error:", error);
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

    const apiKeysCollection = await getCollection("apiKeys");

    // Count existing non-revoked keys
    const existingCount = await apiKeysCollection.countDocuments({
      userId,
      revokedAt: { $exists: false },
    });

    if (keyLimit !== -1 && existingCount >= keyLimit) {
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

    await apiKeysCollection.insertOne({
      id,
      userId,
      keyHash: hash,
      keyPrefix: prefix,
      name,
      createdAt: now,
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
    console.error("[API Keys] POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 },
    );
  }
}
