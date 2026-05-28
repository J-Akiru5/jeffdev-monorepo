/**
 * Bootstrap API - Set current user as founder
 *
 * GET /api/bootstrap - Sets the authenticated user as founder in user_profiles table
 *
 * ⚠️  DEVELOPMENT ONLY - Remove or protect in production
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated. Please sign in first." },
      { status: 401 },
    );
  }

  // Check if in development mode
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 },
    );
  }

  try {
    const adminClient = getAdminClient();

    // Update or create user profile with founder role
    const { error } = await adminClient.from("user_profiles").upsert(
      {
        id: user.id,
        email: user.email,
        role: "founder",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "You are now a founder! Refresh the admin page to access it.",
      userId: user.id,
      role: "founder",
    });
  } catch (error) {
    console.error("[bootstrap] Error setting role:", error);
    return NextResponse.json(
      { error: "Failed to set role. Check Supabase configuration." },
      { status: 500 },
    );
  }
}
