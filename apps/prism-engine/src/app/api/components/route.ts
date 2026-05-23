/**
 * Components API
 *
 * GET  /api/components - List user's saved components
 * POST /api/components - Save new component (checks tier limit)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@jeffdev/db";
import { z } from "zod";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";
import crypto from "crypto";

// =============================================================================
// SCHEMA
// =============================================================================

const SaveComponentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(2000).optional(),
  code: z.string().min(1, "Code is required"),
  rules: z.string().optional(),
  designSystem: z.string(),
  stack: z.string(),
});

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

function generateId(): string {
  return `comp_${crypto.randomBytes(12).toString("hex")}`;
}

// =============================================================================
// GET - List Components
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
    const componentsCollection = await getCollection("components");

    const components = await componentsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Serialize for client
    const serialized = components.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      designSystem: c.designSystem,
      stack: c.stack,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      components: serialized,
      tier,
      limit: TIER_LIMITS[tier].components,
      count: components.length,
    });
  } catch (error) {
    console.error("[Components] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 },
    );
  }
}

// =============================================================================
// POST - Save Component
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

    // Validate input
    const parsed = SaveComponentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, description, code, rules, designSystem, stack } = parsed.data;

    // Check tier limits
    const tier = await getUserTier(userId);
    const limit = TIER_LIMITS[tier].components;

    const componentsCollection = await getCollection("components");

    // Count existing components
    const existingCount = await componentsCollection.countDocuments({ userId });

    if (limit !== -1 && existingCount >= limit) {
      return NextResponse.json(
        {
          error: `You have reached your limit of ${limit} component(s). Upgrade your plan for more.`,
        },
        { status: 403 },
      );
    }

    // Save component
    const id = generateId();
    const now = new Date().toISOString();

    await componentsCollection.insertOne({
      id,
      userId,
      name,
      description: description || "",
      code,
      rules: rules || "",
      designSystem,
      stack,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      name,
      message: "Component saved to library",
    });
  } catch (error) {
    console.error("[Components] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save component" },
      { status: 500 },
    );
  }
}
