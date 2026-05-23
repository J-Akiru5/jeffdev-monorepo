/**
 * Admin Subscription API (Prism Admin)
 * 
 * PATCH /api/admin/subscription - Set ANY user's subscription tier
 * 
 * This is the admin-level endpoint for managing user subscriptions.
 * Allows admins to manually set subscription tiers for any user.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db/cosmos";
import { z } from "zod";

// Zod validation schema
const UpdateTierSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  tier: z.enum(["free", "pro", "team", "enterprise"]),
});

/**
 * GET - List all subscriptions (for admin overview)
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptions = await getCollection("subscriptions");
    const allSubs = await subscriptions
      .find({})
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      subscriptions: allSubs.map((sub) => ({
        id: sub._id.toString(),
        userId: sub.userId,
        tier: sub.tier,
        status: sub.status,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      })),
      count: allSubs.length,
    });
  } catch (error) {
    console.error("[admin/subscription] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update any user's subscription tier (Admin only)
 */
export async function PATCH(request: NextRequest) {
  const { userId: adminUserId } = await auth();

  if (!adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add proper admin role check here
  // For now, we trust any authenticated admin portal user

  try {
    const body = await request.json();
    const parsed = UpdateTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Required: userId, tier (free|pro|team|enterprise)" },
        { status: 400 }
      );
    }

    const { userId, tier } = parsed.data;
    const subscriptions = await getCollection("subscriptions");

    const now = new Date();
    const result = await subscriptions.updateOne(
      { userId },
      {
        $set: {
          tier,
          status: "active",
          updatedAt: now,
          modifiedBy: adminUserId, // Track admin who made the change
        },
        $setOnInsert: {
          userId,
          createdAt: now,
          paypalSubscriptionId: null,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year for manual
        },
      },
      { upsert: true }
    );

    console.log(`[admin/subscription] Admin ${adminUserId} updated ${userId} to tier: ${tier}`);

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
