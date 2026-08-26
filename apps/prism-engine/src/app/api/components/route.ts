import { logError } from "@/lib/log-error";
/**
 * Components API
 *
 * GET  /api/components - List user's saved components
 * POST /api/components - Save new component (checks tier limit)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { TIER_LIMITS, getUserTier } from "@/lib/subscriptions";
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
    const db = getPrismDb();

    const { data: components } = await db
      .from("prism_components")
      .select(
        "id, name, description, designSystem:design_system, stack, createdAt:created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const serialized = components ?? [];

    return NextResponse.json({
      components: serialized,
      tier,
      limit: TIER_LIMITS[tier].components,
      count: serialized.length,
    });
  } catch (error) {
    logError("app/api/components/route", "[Components] GET error:", error);
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

    const db = getPrismDb();

    // Count existing components
    const { count: existingCount } = await db
      .from("prism_components")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (limit !== -1 && (existingCount ?? 0) >= limit) {
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

    await db.from("prism_components").insert({
      id,
      user_id: userId,
      name,
      description: description || "",
      code,
      rules: rules || "",
      design_system: designSystem,
      stack,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({
      id,
      name,
      message: "Component saved to library",
    });
  } catch (error) {
    logError("app/api/components/route", "[Components] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save component" },
      { status: 500 },
    );
  }
}
