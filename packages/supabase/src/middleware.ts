import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(
  request: NextRequest,
  options?: { cookieDomain?: string },
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options: cookieOpts }) =>
          response.cookies.set(name, value, {
            ...cookieOpts,
            ...(options?.cookieDomain
              ? { domain: options.cookieDomain }
              : {}),
          }),
        );
      },
    },
  });

  await supabase.auth.getSession();
  return response;
}
