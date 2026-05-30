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
