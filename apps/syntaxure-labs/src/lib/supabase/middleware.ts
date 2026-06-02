import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Cookie domain for cross-subdomain auth sharing. Set COOKIE_DOMAIN=.syntaxure.dev in production. */
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

/**
 * Supabase Middleware
 * -------------------
 * Refreshes auth sessions and protects admin routes.
 */
export async function updateSession(request: NextRequest) {
  // Skip if environment variables are not set (during build time)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set(name, value, {
              ...options,
              ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
            });
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}
