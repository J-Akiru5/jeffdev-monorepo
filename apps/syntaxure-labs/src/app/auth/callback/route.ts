import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/app/actions/accept-invite";

export const dynamic = "force-dynamic";

/**
 * OAuth Callback Route
 * --------------------
 * Receives the authorization code from Supabase OAuth provider,
 * exchanges it for a session, and processes any pending invite tokens.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const invite = searchParams.get("invite");
  const next = searchParams.get("next") || "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (invite) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && user.email) {
          try {
            const inviteResult = await acceptInvite(
              invite,
              user.id,
              user.email,
            );
            if (inviteResult.success) {
              return NextResponse.redirect(`${origin}/admin/profile`);
            } else {
              console.error("Failed to accept invite:", inviteResult.error);
            }
          } catch (err) {
            console.error("Error during invite acceptance:", err);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("[AUTH CALLBACK ERROR]", error);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
}
