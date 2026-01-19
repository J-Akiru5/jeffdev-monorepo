/**
 * Admin Subscription API
 * 
 * PATCH /api/admin/subscription - Set current user's subscription tier (Dev Testing)
 * 
 * This endpoint is for DEVELOPMENT TESTING ONLY.
 * Allows manually setting subscription tier to test tier-gated features.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db/cosmos";
import { z } from "zod";
import type { SubscriptionTier } from "@/lib/subscriptions";

// Zod validation schema
const UpdateTierSchema = z.object({
  tier: z.enum(["free", "pro", "team", "enterprise"]),
});

/**
 * GET - Get current user's subscription
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptions = await getCollection("subscriptions");
    const subscription = await subscriptions.findOne({ userId });

    if (!subscription) {
      return NextResponse.json({
        userId,
        tier: "free" as SubscriptionTier,
        status: "active",
        message: "No subscription record found, defaulting to free tier",
      });
    }

    return NextResponse.json({
      userId,
      tier: subscription.tier as SubscriptionTier,
      status: subscription.status,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    });
  } catch (error) {
    console.error("[admin/subscription] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update current user's subscription tier
 * For development testing only
 */
export async function PATCH(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if in development mode
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = UpdateTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tier. Must be: free, pro, team, or enterprise" },
        { status: 400 }
      );
    }

    const { tier } = parsed.data;
    const subscriptions = await getCollection("subscriptions");

    const now = new Date();
    const result = await subscriptions.updateOne(
      { userId },
      {
        $set: {
          tier,
          status: "active",
          updatedAt: now,
        },
        $setOnInsert: {
          userId,
          createdAt: now,
          paypalSubscriptionId: null,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
      { upsert: true }
    );

    console.log(`[admin/subscription] Updated ${userId} to tier: ${tier}`);

    return NextResponse.json({
      success: true,
      userId,
      tier,
      message: `Subscription updated to ${tier} tier`,
      upserted: result.upsertedCount > 0,
    });
  } catch (error) {
    console.error("[admin/subscription] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
