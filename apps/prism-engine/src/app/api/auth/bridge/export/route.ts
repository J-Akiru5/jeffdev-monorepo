/**
 * Auth Bridge Export (Dev Only)
 * Exports the current user's Supabase session tokens as JSON.
 * Only available in development mode for cross-app session sharing.
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  return NextResponse.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}
