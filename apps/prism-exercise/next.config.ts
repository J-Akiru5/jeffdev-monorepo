import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jdstudio/ui", "@jeffdev/db"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

// PWA is configured via next-pwa - will be enabled in production
// For now, export base config to avoid type issues
export default nextConfig;
