import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { pullGoogleEvents } from "@/lib/google-calendar";

/**
 * POST /api/calendar/sync
 * Manual sync for the current session's user.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pullGoogleEvents(user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json(result);
}

/**
 * GET /api/calendar/sync
 * Scheduled reconciliation for ALL connected users.
 * Triggered by Vercel Cron with `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { data: tokens } = await admin
    .from("user_tokens")
    .select("user_id")
    .eq("provider", "google");

  const results: {
    userId: string;
    synced: number;
    removed: number;
    error?: string;
  }[] = [];

  for (const token of tokens || []) {
    const result = await pullGoogleEvents(String(token.user_id));
    results.push({ userId: String(token.user_id), ...result });
  }

  return NextResponse.json({ users: results.length, results });
}
