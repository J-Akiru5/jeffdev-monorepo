/**
 * Syntaxure Labs Proxy
 * --------------------
 * Redirects /admin/* routes to prism-admin (https://admin.syntaxure.dev).
 * Only /admin/login is allowed through for authentication.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_BASE =
  process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004";

/** Map known SLabs admin routes → prism-admin equivalents. */
const ROUTE_MAP: Record<string, string> = {
  "/admin": "/admin/agency/dashboard",
  "/admin/invoices": "/admin/agency/invoices",
  "/admin/invoices/new": "/admin/agency/invoices/new",
  "/admin/profile": "/admin/agency/settings",
  "/admin/projects": "/admin/agency/projects",
  "/admin/projects/new": "/admin/agency/projects/new",
};

function redirectTo(targetPath: string, request: NextRequest) {
  const url = new URL(targetPath, ADMIN_BASE);
  // Preserve query parameters from the original request
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Normalize: strip trailing slash (except for root)
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // Allow login page to render (auth happens here)
  if (normalized === "/admin/login") {
    return NextResponse.next();
  }

  // Dynamic routes
  const invoicesMatch = normalized.match(
    /^\/admin\/invoices\/([\w-]+)$/,
  );
  if (invoicesMatch) {
    return redirectTo(`/admin/agency/invoices/${invoicesMatch[1]}`, request);
  }

  const projectsEditMatch = normalized.match(
    /^\/admin\/projects\/([\w-]+)\/edit$/,
  );
  if (projectsEditMatch) {
    return redirectTo(
      `/admin/agency/projects/${projectsEditMatch[1]}/edit`,
      request,
    );
  }

  const projectsMatch = normalized.match(
    /^\/admin\/projects\/([\w-]+)$/,
  );
  if (projectsMatch) {
    return redirectTo(
      `/admin/agency/projects/${projectsMatch[1]}`,
      request,
    );
  }

  // Static routes
  const target = ROUTE_MAP[normalized];
  if (target) {
    return redirectTo(target, request);
  }

  // Fallback for any other /admin/* route
  if (normalized.startsWith("/admin/")) {
    return redirectTo("/admin/agency/dashboard", request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
