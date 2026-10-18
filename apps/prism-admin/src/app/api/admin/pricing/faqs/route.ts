/**
 * Pricing FAQs API
 *
 * GET    /api/admin/pricing/faqs          — List all FAQs, optionally filtered by ?app=
 * POST   /api/admin/pricing/faqs          — Create a new FAQ
 * PATCH  /api/admin/pricing/faqs          — Update an FAQ (requires id in body)
 * DELETE /api/admin/pricing/faqs?id=...   — Delete an FAQ
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireRole, AuthzError } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import type { PricingFAQRow } from "@/lib/database.types";

function faqs() {
  return getAdminClient().from("pricing_faqs");
}

// GET — List FAQs
export async function GET(request: NextRequest) {
  try {
    await requireRole();

    const { searchParams } = new URL(request.url);
    const app = searchParams.get("app");

    let query = faqs().select("*").order("sort_order", { ascending: true });

    if (app) {
      query = query.eq("app", app as PricingFAQRow["app"]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[pricing-faqs GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 },
    );
  }
}

// POST — Create FAQ
export async function POST(request: NextRequest) {
  try {
    await requireRole();

    const body = await request.json();

    const { data, error } = await faqs()
      .insert({
        app: body.app,
        question: body.question,
        answer: body.answer,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/pricing");
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[pricing-faqs POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 },
    );
  }
}

// PATCH — Update FAQ
export async function PATCH(request: NextRequest) {
  try {
    await requireRole();

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing faq id" },
        { status: 400 },
      );
    }

    const updateFields: Partial<PricingFAQRow> & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    const allowedFields: (keyof PricingFAQRow)[] = ["app", "question", "answer", "sort_order"];

    for (const field of allowedFields) {
      if (field in updates) {
        (updateFields as Record<string, unknown>)[field] = updates[field] ?? null;
      }
    }

    const { data, error } = await faqs()
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/pricing");
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[pricing-faqs PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 },
    );
  }
}

// DELETE — Delete FAQ
export async function DELETE(request: NextRequest) {
  try {
    await requireRole();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing faq id" },
        { status: 400 },
      );
    }

    const { error } = await faqs().delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/pricing");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[pricing-faqs DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 },
    );
  }
}
