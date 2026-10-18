import { withSentry } from "@syntaxure/sentry-config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@syntaxure/ui"],
};

export default withSentry(nextConfig, "prism-manage");
