import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jdstudio/ui", "@jeffdev/db"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
