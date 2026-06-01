import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Supported locales
const locales = ["en-US", "tl", "ja", "es", "id", "en-GB", "ru", "nl"];
const defaultLocale = "en-US";
const LOCALE_COOKIE = "PRISM_LOCALE";

// Get preferred locale from cookie or headers
function getLocale(request: NextRequest): string {
  // 1. Check for saved locale in cookie (user's explicit choice)
  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (savedLocale && locales.includes(savedLocale)) {
    return savedLocale;
  }

  // 2. Fall back to Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  // Simple locale matching - match first supported locale found in header
  const preferredLocales = acceptLanguage
    .split(",")
    .map((l) => l.split(";")[0]?.trim() ?? "");

  for (const locale of preferredLocales) {
    if (locales.includes(locale)) {
      return locale;
    }
    // Try matching language code only (e.g. 'en' matches 'en-US')
    const langCode = locale.split("-")[0] ?? "";
    const matchedLocale = locales.find((l) => l.startsWith(langCode));
    if (matchedLocale) {
      return matchedLocale;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip internal Next.js paths, static files, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/prism-icon.png"
  ) {
    return;
  }

  // Check if pathname already starts with a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  // Redirect if missing locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);

    // Redirect to locale path and persist the locale in a cookie
    const url = new URL(
      `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
      request.url,
    );
    const response = NextResponse.redirect(url);

    // Set cookie so subsequent requests remember the user's choice
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next|api|favicon.ico|prism-icon.png).*)",
  ],
};
