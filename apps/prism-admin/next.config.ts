import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@syntaxure/ui", "@syntaxure-labs/db"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default async function config() {
  if (process.env.ANALYZE === "true") {
    const withBundleAnalyzer = (await import("@next/bundle-analyzer")).default;
    return withBundleAnalyzer()(nextConfig);
  }
  return nextConfig;
}
