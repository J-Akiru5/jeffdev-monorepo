import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/app/actions/accept-invite";

export const dynamic = "force-dynamic";

const ADMIN_BASE =
  process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004";

/**
 * OAuth Callback Route
 * --------------------
 * Receives the authorization code from Supabase OAuth provider,
 * exchanges it for a session, processes any pending invite tokens,
 * then redirects to prism-admin.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const invite = searchParams.get("invite");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Invite flow → prism-admin profile setup
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
              return NextResponse.redirect(
                new URL("/admin/agency/settings", ADMIN_BASE).toString(),
              );
            }
            console.error("Failed to accept invite:", inviteResult.error);
          } catch (err) {
            console.error("Error during invite acceptance:", err);
          }
        }
      }

      // Normal login → prism-admin dashboard
      return NextResponse.redirect(
        new URL("/admin/agency/dashboard", ADMIN_BASE).toString(),
      );
    }

    console.error("[AUTH CALLBACK ERROR]", error);
  }

  // Auth failed → back to login
  return NextResponse.redirect(
    new URL("/admin/login?error=auth_failed", origin).toString(),
  );
}
