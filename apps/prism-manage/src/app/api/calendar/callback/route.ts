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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Validate CSRF state parameter
  const stateParam = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get("google_oauth_state")?.value;
  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return NextResponse.redirect(
      new URL("/calendar?error=csrf_mismatch", request.url),
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/calendar?error=no_code", request.url),
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!clientId || !clientSecret || !siteUrl) {
    return NextResponse.redirect(new URL("/calendar?error=config_error", request.url));
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${siteUrl}/api/calendar/callback`,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in user_tokens table
    const { error: upsertError } = await supabase.from("user_tokens").upsert(
      {
        user_id: user.id,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        scope: tokens.scope || null,
      },
      { onConflict: "user_id, provider" },
    );

    if (upsertError) throw upsertError;

    // Clear the CSRF cookie
    const response = NextResponse.redirect(
      new URL("/calendar?sync=success", request.url),
    );
    response.cookies.delete("google_oauth_state");

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/calendar?error=auth_failed", request.url),
    );
  }
}
