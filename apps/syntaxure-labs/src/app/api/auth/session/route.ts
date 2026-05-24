/**
 * Session API Route (DEPRECATED)
 * -------------------------------
 * Supabase Auth handles sessions via SSR cookies automatically.
 * This endpoint is kept for backward compat with clients
 * that still call it (e.g., invite flow).
 *
 * The actual session management happens in middleware.ts
 * via supabase/ssr's updateSession().
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/app/actions/accept-invite";

export async function POST(request: NextRequest) {
  try {
    const { inviteToken } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Handle invite if present
    let redirectPath = "/admin";
    if (inviteToken) {
      if (!user.email) {
        return NextResponse.json(
          { error: "Email is required for invite acceptance" },
          { status: 400 },
        );
      }

      const inviteResult = await acceptInvite(inviteToken, user.id, user.email);

      if (!inviteResult.success) {
        return NextResponse.json(
          { error: inviteResult.error || "Failed to accept invite" },
          { status: 400 },
        );
      }

      redirectPath = "/admin/profile";
    }

    return NextResponse.json(
      { success: true, uid: user.id, redirectPath },
      { status: 200 },
    );
  } catch (error) {
    console.error("[SESSION ERROR]", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 },
    );
  }
}
