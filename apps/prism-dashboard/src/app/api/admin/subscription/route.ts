/**
 * Admin Subscription API
 * 
 * GET    /api/admin/subscription       - List all subscriptions (admin only)
 * GET    /api/admin/subscription?userId=x - Get specific user's subscription
 * PATCH  /api/admin/subscription       - Update any user's tier (admin only)
 * 
 * @security Requires admin/founder role in Clerk private metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db/cosmos";
import { z } from "zod";

async function requireAdmin(adminUserId: string): Promise<void> {
  const clerk = await clerkClient();
  const adminUser = await clerk.users.getUser(adminUserId);
  const role = adminUser.privateMetadata?.role as string | undefined;
  if (role !== 'admin' && role !== 'founder') {
    throw new Error('Forbidden');
  }
}

const UpdateTierSchema = z.object({
  userId: z.string().min(1),
  tier: z.enum(["free", "pro", "team", "enterprise"]),
});

/**
 * GET - List all subscriptions or get specific user's
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(userId);
    const subscriptions = await getCollection("subscriptions");
    const targetUserId = new URL(request.url).searchParams.get('userId');

    if (targetUserId) {
      const sub = await subscriptions.findOne({ userId: targetUserId });
      if (!sub) {
        return NextResponse.json({ userId: targetUserId, tier: "free", status: "active" });
      }
      return NextResponse.json({
        userId: targetUserId,
        tier: sub.tier,
        status: sub.status,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      });
    }

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
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[admin/subscription] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

/**
 * PATCH - Update any user's subscription tier (admin only)
 */
export async function PATCH(request: NextRequest) {
  const { userId: adminUserId } = await auth();
  if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(adminUserId);

    const body = await request.json();
    const parsed = UpdateTierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Required: userId + tier (free|pro|team|enterprise)" },
        { status: 400 }
      );
    }

    const { userId, tier } = parsed.data;
    const subscriptions = await getCollection("subscriptions");
    const now = new Date();

    const result = await subscriptions.updateOne(
      { userId },
      {
        $set: { tier, status: "active", updatedAt: now, modifiedBy: adminUserId },
        $setOnInsert: {
          userId, createdAt: now, paypalSubscriptionId: null,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        },
      },
      { upsert: true }
    );

    console.log(`[admin/subscription] ${adminUserId} set ${userId} → ${tier}`);
    return NextResponse.json({
      success: true, userId, tier,
      message: `Updated to ${tier}`, upserted: result.upsertedCount > 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[admin/subscription] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
