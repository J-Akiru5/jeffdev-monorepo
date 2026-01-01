import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Vercel Edge Middleware for Geo-Based Currency Detection
 * --------------------------------------------------------
 * Automatically sets a 'currency' cookie based on the visitor's country.
 * - Philippines (PH) → PHP
 * - All other countries → USD
 *
 * The cookie is read by the CurrencyContext on the client side.
 *
 * Note: In development, geo data is not available. Use the fallback or
 * set currency cookie manually for testing.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check if currency cookie already exists (don't override user preference)
  const existingCurrency = request.cookies.get('currency')?.value;
  if (existingCurrency) {
    return response;
  }

  // Detect country from Vercel's geo headers
  // In production, Vercel automatically provides the x-vercel-ip-country header
  const country = request.headers.get('x-vercel-ip-country') || 'US';

  // Set currency based on country
  const currency = country === 'PH' ? 'PHP' : 'USD';

  // Set cookie with 30-day expiry
  response.cookies.set('currency', currency, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });

  return response;
}

// Only run middleware on specific paths (exclude API routes, static files, etc.)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
