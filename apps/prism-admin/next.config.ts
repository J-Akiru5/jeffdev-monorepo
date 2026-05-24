import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  transpilePackages: ["@syntaxure/ui", "@syntaxure-labs/db"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer()(nextConfig)
  : nextConfig;
