
import { logError } from "@/lib/log-error";/**
 * API Key Revocation
 *
 * DELETE /api/api-keys/[id] - Revoke an API key
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";

export async function DELETE(
  request: NextRequest,
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

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Key ID is required" },
        { status: 400 },
      );
    }

    const db = getPrismDb();

    // Find the key and verify ownership
    const { data: existingKey } = await db
      .from("prism_api_keys")
      .select("id, revokedAt:revoked_at")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (existingKey.revokedAt) {
      return NextResponse.json(
        { error: "API key is already revoked" },
        { status: 400 },
      );
    }

    // Soft delete - mark as revoked
    await db
      .from("prism_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      message: "API key has been revoked",
    });
  } catch (error) {
    logError("app/api/api-keys/[id]/route", "[API Keys] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
