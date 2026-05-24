import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: process.platform === "win32" ? undefined : "standalone",

  serverExternalPackages: ["mongodb", "gremlin"],

  images: {
    remotePatterns: [
      // TODO: Add Supabase Storage URL pattern when images are hosted there
      // { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@syntaxure/ui", "recharts"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

const configWithSentry = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "jeffdev",
  project: process.env.SENTRY_PROJECT || "prism-engine",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  tunnelRoute: "/monitoring",
  disableLogger: true,
});

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer()(configWithSentry)
  : configWithSentry;
