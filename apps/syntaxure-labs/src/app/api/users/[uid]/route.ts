/**
 * User API Route
 * ---------------
 * Fetch user profile from Supabase.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await params;

    const supabase = (await getAdminClient()) as any;
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) throw error;

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      uid: profile.id,
      ...profile,
    });
  } catch (error) {
    console.error("[GET USER ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
