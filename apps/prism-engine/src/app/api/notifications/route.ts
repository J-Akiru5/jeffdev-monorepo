/**
 * Notification Preferences API
 * GET  /api/notifications — fetch current preferences
 * POST /api/notifications — save preferences
 *
 * Preferences stored on `user_profiles.notification_prefs` (Postgres/Supabase).
 * Previously lived in the Cosmos DB `users` collection, keyed by `supabaseId`
 * — folded into user_profiles during the Cosmos → Postgres migration since
 * user_profiles.id already IS the Supabase auth user id.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";

const PrefsSchema = z.object({
  productUpdates: z.boolean(),
  usageAlerts: z.boolean(),
  marketing: z.boolean(),
});

export type NotificationPrefs = z.infer<typeof PrefsSchema>;

const DEFAULT_PREFS: NotificationPrefs = {
  productUpdates: true,
  usageAlerts: true,
  marketing: false,
};

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
    const db = getPrismDb();
    const { data: profile } = await db
      .from("user_profiles")
      .select("notificationPrefs:notification_prefs")
      .eq("id", userId)
      .maybeSingle();
    const prefs = profile?.notificationPrefs ?? DEFAULT_PREFS;
    return NextResponse.json({ prefs });
  } catch {
    return NextResponse.json({ prefs: DEFAULT_PREFS });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preferences", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const db = getPrismDb();
    await db
      .from("user_profiles")
      .update({
        notification_prefs: parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    return NextResponse.json({ success: true, prefs: parsed.data });
  } catch {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 },
    );
  }
}
