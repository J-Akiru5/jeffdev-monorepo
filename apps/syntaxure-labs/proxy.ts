/**
 * Syntaxure Labs Proxy
 * --------------------
 * Handles session refresh and redirects /admin/* routes to prism-admin.
 * Only /admin/login is allowed through for local authentication.
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_BASE =
  process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004";

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
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // Allow login page through (auth happens locally)
  if (normalized === "/admin/login") {
    return await updateSession(request);
  }

  // Dynamic routes → prism-admin
  const invoicesMatch = normalized.match(/^\/admin\/invoices\/([\w-]+)$/);
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

  const projectsMatch = normalized.match(/^\/admin\/projects\/([\w-]+)$/);
  if (projectsMatch) {
    return redirectTo(
      `/admin/agency/projects/${projectsMatch[1]}`,
      request,
    );
  }

  // Static routes → prism-admin
  const target = ROUTE_MAP[normalized];
  if (target) {
    return redirectTo(target, request);
  }

  // Fallback for any other /admin/* route
  if (normalized.startsWith("/admin/")) {
    return redirectTo("/admin/agency/dashboard", request);
  }

  // Non-admin routes: refresh session
  return await updateSession(request);
}

export const config = {
  matcher: "/admin/:path*",
};
