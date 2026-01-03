import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 1. STEALTH MODE
   *    Disable the 'X-Powered-By: Next.js' header.
   */
  poweredByHeader: false,

  /**
   * 2. SECURITY HEADERS ("THE FORTRESS")
   *    Matches agency app security configuration.
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
        ],
      },
    ];
  },
};

export default nextConfig;
