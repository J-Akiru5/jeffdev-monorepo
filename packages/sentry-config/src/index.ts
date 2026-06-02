import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const SENTRY_ORG = process.env.SENTRY_ORG || "";

export interface SentryInitConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
}

export function createSentryConfig(
  project: string,
  options?: { tracesSampleRate?: number },
): SentryInitConfig {
  const { tracesSampleRate = 0.25 } = options ?? {};

  return {
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: IS_PRODUCTION ? tracesSampleRate : 0.0,
  };
}

export function withSentry(
  nextConfig: NextConfig,
  project: string,
  options?: { tracesSampleRate?: number },
) {
  return withSentryConfig(nextConfig, {
    org: SENTRY_ORG,
    project,
    silent: !process.env.CI,
    widenClientFileUpload: false,
    reactComponentAnnotation: { enabled: true },
    tunnelRoute: "/monitoring",
    disableLogger: true,
  });
}
