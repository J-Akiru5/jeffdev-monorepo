import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

/**
 * Google Calendar OAuth — Auth Route
 * -----------------------------------
 * Redirects user to Google OAuth consent screen.
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3007")));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!clientId || !clientSecret || !siteUrl) {
    return NextResponse.json({ error: "Google Calendar is not configured" }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${siteUrl}/api/calendar/callback`,
  );

  // Generate CSRF state token
  const state = crypto.randomUUID();

  // Store state in a cookie for callback validation
  const response = NextResponse.redirect(
    oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
      ],
      state,
      prompt: "consent",
    })
  );

  // Set CSRF cookie — use supabase-anonymous style cookie
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
