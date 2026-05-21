/**
 * Notification Preferences API
 * GET  /api/notifications — fetch current preferences
 * POST /api/notifications — save preferences
 *
 * Preferences stored in Cosmos DB users collection under notificationPrefs field.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCollection } from "@jeffdev/db";
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await getCollection("users");
    const doc = await users.findOne({ clerkUserId: userId });
    const prefs = doc?.notificationPrefs ?? DEFAULT_PREFS;
    return NextResponse.json({ prefs });
  } catch {
    return NextResponse.json({ prefs: DEFAULT_PREFS });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preferences", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const users = await getCollection("users");
    await users.updateOne(
      { clerkUserId: userId },
      {
        $set: {
          notificationPrefs: parsed.data,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ success: true, prefs: parsed.data });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
