/**
 * Pricing Plans API
 *
 * GET  /api/admin/pricing          — List all plans, optionally filtered by ?app=
 * POST /api/admin/pricing          — Create a new plan
 * PATCH /api/admin/pricing         — Update a plan (requires id in body)
 * DELETE /api/admin/pricing?id=... — Delete a plan
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const TABLE = "pricing_plans";

function table() {
  return getAdminClient().from(TABLE);
}

// GET — List pricing plans
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const app = searchParams.get("app");

    let query = table().select("*").order("sort_order", { ascending: true });

    if (app) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = (query as any).eq("app", app);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("[pricing GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing plans" },
      { status: 500 },
    );
  }
}

// POST — Create a pricing plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (table() as any)
      .insert({
        app: body.app,
        plan_type: body.plan_type || "tier",
        name: body.name,
        tier_slug: body.tier_slug,
        tagline: body.tagline || null,
        description: body.description || null,
        price_monthly_php: body.price_monthly_php ?? null,
        price_monthly_usd: body.price_monthly_usd ?? null,
        price_annual_php: body.price_annual_php ?? null,
        price_annual_usd: body.price_annual_usd ?? null,
        price_original_php: body.price_original_php ?? null,
        price_original_usd: body.price_original_usd ?? null,
        discount_label: body.discount_label || null,
        monthly_addon: body.monthly_addon || null,
        features: body.features || [],
        comparison_values: body.comparison_values || {},
        cta_label: body.cta_label || "Choose plan",
        cta_href: body.cta_href || null,
        cta_variant: body.cta_variant || "secondary",
        highlighted: body.highlighted || false,
        limited_deal: body.limited_deal || false,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/pricing");
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[pricing POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create pricing plan" },
      { status: 500 },
    );
  }
}

// PATCH — Update a pricing plan
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing plan id" },
        { status: 400 },
      );
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {};
    const allowedFields = [
      "app", "plan_type", "name", "tier_slug", "tagline", "description",
      "price_monthly_php", "price_monthly_usd", "price_annual_php", "price_annual_usd",
      "price_original_php", "price_original_usd", "discount_label", "monthly_addon",
      "features", "comparison_values", "cta_label", "cta_href", "cta_variant",
      "highlighted", "limited_deal", "sort_order",
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        updateFields[field] = updates[field] ?? null;
      }
    }

    // Always update the timestamp
    updateFields.updated_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (table() as any)
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/pricing");
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[pricing PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update pricing plan" },
      { status: 500 },
    );
  }
}

// DELETE — Delete a pricing plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing plan id" },
        { status: 400 },
      );
    }

    const { error } = await table().delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/pricing");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[pricing DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete pricing plan" },
      { status: 500 },
    );
  }
}
