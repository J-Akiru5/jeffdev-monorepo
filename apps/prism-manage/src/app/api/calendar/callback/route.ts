import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

/**
 * Google Calendar OAuth — Callback Route
 * ---------------------------------------
 * Exchanges auth code for tokens and stores them in user_tokens table.
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/calendar?error=no_code", request.url));
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in user_tokens table
    await supabase.from("user_tokens").upsert({
      user_id: user.id,
      provider: "google",
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || null,
      token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      scope: tokens.scope || null,
      metadata: { email: tokens.id_token || null },
    }, { onConflict: "user_id, provider" });

    return NextResponse.redirect(new URL("/calendar?sync=success", request.url));
  } catch (error) {
    console.error("Google Calendar OAuth error:", error);
    return NextResponse.redirect(new URL("/calendar?error=auth_failed", request.url));
  }
}
