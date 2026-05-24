/**
 * Admin Subscription API (Prism Admin)
 *
 * GET  /api/admin/subscription - List all subscriptions
 * PATCH /api/admin/subscription - Set ANY user's subscription tier
 *
 * Uses Supabase as the data store. Admins can manually set subscription
 * tiers for any user (overrides PayPal-managed subscriptions).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = getAdminClient();
    const { data: subscriptions, error } = await (admin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100) as any);

    if (error) {
      console.error("[admin/subscription] GET error:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      subscriptions: (subscriptions || []).map((sub: any) => ({
        id: sub.id,
        userId: sub.user_id,
        userEmail: sub.user_email,
        tier: sub.plan,
        status: sub.status,
        amount: sub.amount,
        nextBillingDate: sub.current_period_end,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
      })),
      count: subscriptions?.length || 0,
    });
  } catch (error) {
    console.error("[admin/subscription] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

/**
 * PATCH - Update any user's subscription tier (Admin only)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = UpdateTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Required: userId, tier (free|pro|team|enterprise)",
        },
        { status: 400 },
      );
    }

    const { userId, tier } = parsed.data;
    const now = new Date().toISOString();
    const admin = getAdminClient();
    const subs = admin.from("subscriptions") as any;
    const profiles = admin.from("user_profiles") as any;

    // Upsert subscription record
    const { error: subError } = await subs.upsert({
      user_id: userId,
      plan: tier,
      status: "active",
      billing_cycle: "monthly",
      amount: 0,
      currency: "USD",
      current_period_start: now,
      current_period_end: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      metadata: { modified_by: adminUser.id, source: "admin_override" },
      updated_at: now,
    }, {
      onConflict: "user_id",
      ignoreDuplicates: false,
    });

    if (subError) {
      console.error("[admin/subscription] Upsert error:", subError);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 },
      );
    }

    // Update user tier in profiles
    const { error: profileError } = await profiles
      .update({ tier, updated_at: now })
      .eq("id", userId);

    if (profileError) {
      console.error(
        "[admin/subscription] Profile update error:",
        profileError,
      );
    }

    console.log(
      `[admin/subscription] Admin ${adminUser.id} updated ${userId} to tier: ${tier}`,
    );

    return NextResponse.json({
      success: true,
      userId,
      tier,
      message: `Subscription updated to ${tier} tier`,
    });
  } catch (error) {
    console.error("[admin/subscription] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 },
    );
  }
}
