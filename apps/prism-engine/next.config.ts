import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Find monorepo root upward from process.cwd() or current directory
let rootDir = process.cwd();
while (rootDir && rootDir !== path.parse(rootDir).root) {
  if (fs.existsSync(path.join(rootDir, "pnpm-workspace.yaml"))) {
    break;
  }
  rootDir = path.dirname(rootDir);
}

const envFiles = [".env", ".env.local"];
envFiles.forEach((file) => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const firstEqual = trimmed.indexOf("=");
        if (firstEqual === -1) return;
        const key = trimmed.substring(0, firstEqual).trim();
        let val = trimmed.substring(firstEqual + 1).trim();
        // Remove surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      });
    } catch {}
  }
});

// Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set if only NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is present
if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

const nextConfig: NextConfig = {
  transpilePackages: ["@syntaxure/ui", "@syntaxure-labs/db"],
  turbopack: {
    root: rootDir,
  },
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

export default async function config() {
  const configWithSentry = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG || "jeffdev",
    project: process.env.SENTRY_PROJECT || "prism-engine",
    silent: !process.env.CI,
    widenClientFileUpload: false,
    reactComponentAnnotation: { enabled: true },
    tunnelRoute: "/monitoring",
    disableLogger: true,
  });

  if (process.env.ANALYZE === "true") {
    const withBundleAnalyzer = (await import("@next/bundle-analyzer")).default;
    return withBundleAnalyzer()(configWithSentry);
  }
  return configWithSentry;
}
