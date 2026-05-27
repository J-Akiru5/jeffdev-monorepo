import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/tasks";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has position set in metadata
      // If not, redirect to position-prompt before proceeding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && !user.user_metadata?.position) {
        return NextResponse.redirect(
          `${origin}/sign-in?needs_position=true`,
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback: error or no code
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
}
