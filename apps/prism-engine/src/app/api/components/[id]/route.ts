
import { logError } from "@/lib/log-error";/**
 * Single Component API
 *
 * GET    /api/components/[id] - Get component details
 * DELETE /api/components/[id] - Delete component
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";

// =============================================================================
// GET - Get Single Component
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const { id } = await params;

  try {
    const db = getPrismDb();
    const { data: component } = await db
      .from("prism_components")
      .select(
        "id, name, description, code, rules, designSystem:design_system, stack, createdAt:created_at, updatedAt:updated_at",
      )
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: component.id,
      name: component.name,
      description: component.description,
      code: component.code,
      rules: component.rules,
      designSystem: component.designSystem,
      stack: component.stack,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
    });
  } catch (error) {
    logError("app/api/components/[id]/route", "[Components] GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch component" },
      { status: 500 },
    );
  }
}

// =============================================================================
// DELETE - Delete Component
// =============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const { id } = await params;

  try {
    const db = getPrismDb();

    // Verify ownership
    const { data: component } = await db
      .from("prism_components")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      );
    }

    await db.from("prism_components").delete().eq("id", id).eq("user_id", userId);

    return NextResponse.json({ success: true, message: "Component deleted" });
  } catch (error) {
    logError("app/api/components/[id]/route", "[Components] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete component" },
      { status: 500 },
    );
  }
}
