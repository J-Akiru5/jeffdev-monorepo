/**
 * Pricing FAQs API
 *
 * GET    /api/admin/pricing/faqs          — List all FAQs, optionally filtered by ?app=
 * POST   /api/admin/pricing/faqs          — Create a new FAQ
 * PATCH  /api/admin/pricing/faqs          — Update an FAQ (requires id in body)
 * DELETE /api/admin/pricing/faqs?id=...   — Delete an FAQ
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const TABLE = "pricing_faqs";

function table() {
  return getAdminClient().from(TABLE);
}

// GET — List FAQs
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing faq id" },
        { status: 400 },
      );
    }

    const updateFields: Record<string, unknown> = {};
    const allowedFields = ["app", "question", "answer", "sort_order"];

    for (const field of allowedFields) {
      if (field in updates) {
        updateFields[field] = updates[field] ?? null;
      }
    }

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing faq id" },
        { status: 400 },
      );
    }

    const { error } = await table().delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/pricing");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[pricing-faqs DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 },
    );
  }
}
