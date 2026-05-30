import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseUrlAndKey } from "./env";

/** Cookie domain for cross-subdomain auth sharing. Set COOKIE_DOMAIN=.syntaxure.dev in production. */
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseUrlAndKey();

  // During build time, return a placeholder if env vars are missing
  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
              }),
            );
          } catch {
            // The `setAll` method was called from a Server Component
            // This can be ignored if you have middleware refreshing user sessions
          }
        },
      },
    },
  );
}
