import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://www.syntaxure.dev",
  "https://prism-engine.vercel.app",
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_PRISM_URL,
].filter(Boolean) as string[];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*"))
      ? origin
      : "https://www.syntaxure.dev";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Access-Control-Max-Age": "86400",
  };
}

export async function updateSession(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(request.headers.get("origin"));
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

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

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add CORS headers to API responses
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const corsHeaders = getCorsHeaders(request.headers.get("origin"));
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
            }),
          );
        },
      },
    },
  );

  // Refresh session
  await supabase.auth.getSession();

  return response;
}
