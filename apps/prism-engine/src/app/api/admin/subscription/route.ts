import { logError } from "@/lib/log-error";
/**
 * Admin Subscription API
 *
 * GET    /api/admin/subscription       - List all subscriptions (admin only)
 * GET    /api/admin/subscription?userId=x - Get specific user's subscription
 * PATCH  /api/admin/subscription       - Update any user's tier (admin only)
 *
 * @security Requires admin/founder role in Supabase user_metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";

async function requireAdmin(user: unknown): Promise<void> {
  // Check if user is admin in user_metadata
  const metadata = user as { user_metadata?: { role?: string } } | undefined;
  const role = metadata?.user_metadata?.role as string | undefined;
  if (role !== "admin" && role !== "founder") {
    throw new Error("Forbidden");
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireAdmin(user);
    const db = getPrismDb();
    const targetUserId = new URL(request.url).searchParams.get("userId");

    if (targetUserId) {
      const { data: sub } = await db
        .from("prism_subscriptions")
        .select("tier, status, createdAt:created_at, updatedAt:updated_at")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (!sub) {
        return NextResponse.json({
          userId: targetUserId,
          tier: "free",
          status: "active",
        });
      }
      return NextResponse.json({
        userId: targetUserId,
        tier: sub.tier,
        status: sub.status,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      });
    }

    const { data: allSubs } = await db
      .from("prism_subscriptions")
      .select(
        "_id:id, userId:user_id, tier, status, createdAt:created_at, updatedAt:updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(100);

    return NextResponse.json({
      subscriptions: (allSubs ?? []).map((sub) => ({
        id: sub._id.toString(),
        userId: sub.userId,
        tier: sub.tier,
        status: sub.status,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      })),
      count: (allSubs ?? []).length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logError("app/api/admin/subscription/route", "[admin/subscription] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

/**
 * PATCH - Update any user's subscription tier (admin only)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminUserId = user.id;

  try {
    await requireAdmin(user);

    const body = await request.json();
    const parsed = UpdateTierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Required: userId + tier (free|pro|team|enterprise)" },
        { status: 400 },
      );
    }

    const { userId, tier } = parsed.data;
    const db = getPrismDb();
    const now = new Date();

    const { data: existing } = await db
      .from("prism_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await db.from("prism_subscriptions").upsert(
      {
        user_id: userId,
        tier,
        status: "active",
        updated_at: now.toISOString(),
        modified_by: adminUserId,
        ...(existing
          ? {}
          : {
              current_period_start: now.toISOString(),
              current_period_end: new Date(
                now.getTime() + 365 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }),
      },
      { onConflict: "user_id" },
    );

    if (error) throw error;

    console.log(`[admin/subscription] ${adminUserId} set ${userId} → ${tier}`);
    return NextResponse.json({
      success: true,
      userId,
      tier,
      message: `Updated to ${tier}`,
      upserted: !existing,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logError("app/api/admin/subscription/route", "[admin/subscription] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
