import { NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * Google Calendar OAuth — Auth Route
 * -----------------------------------
 * Redirects user to Google OAuth consent screen.
 */

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`,
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    prompt: "consent",
  });

  return NextResponse.redirect(authUrl);
}
