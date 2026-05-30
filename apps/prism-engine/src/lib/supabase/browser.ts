import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrlAndKey } from "./env";

export function createClient() {
  const { url, key } = getSupabaseUrlAndKey();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.",
    );
  }

  const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;

  return createBrowserClient(url, key, {
    ...(COOKIE_DOMAIN ? { cookieOptions: { domain: COOKIE_DOMAIN } } : {}),
  });
}
