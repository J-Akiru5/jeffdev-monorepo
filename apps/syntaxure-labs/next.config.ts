import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  /*
   * 0. EXPERIMENTAL FEATURES
   *    Increase body size limit for server actions to allow larger file uploads (10MB).
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  /*
   * 1. HIDE STACK DETAILS
   *    Disable the 'X-Powered-By: Next.js' header.
   */
  poweredByHeader: false,

  /*
   * 2. IMAGE OPTIMIZATION
   *    Allow external images from our storage providers.
   */
  images: {
    remotePatterns: [
      // If we ever use direct Supabase Storage URLs, add them here.
      // { protocol: 'https', hostname: '*.supabase.co' },
    ],
    // Dangerously allow SVG if needed for favicons, but usually unnecessary with Next/Image
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  /*
   * 3. SECURITY HEADERS ("THE FORTRESS")
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevents clickjacking
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          // CSP is best handled via Middleware for nonces, but we can add a basic one here if needed.
          // For now, we rely on the others.
        ],
      },
    ];
  },
};

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer()(nextConfig)
  : nextConfig;
