/**
 * Auth Bridge Import (Dev Only)
 * -----------------------------
 * Imports a Supabase session from another app's export.
 * Only available in development mode for cross-app session sharing.
 *
 * Accepts { access_token, refresh_token } and sets the session cookies.
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 });
  }

  const body = await request.json();
  const { access_token, refresh_token } = body;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "access_token and refresh_token are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error || !session) {
    return NextResponse.json({ error: "Failed to set session: " + error?.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}
