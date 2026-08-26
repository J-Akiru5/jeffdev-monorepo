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
  // Phase 5 hotfix: release/sourcemap upload requires ALL THREE of org,
  // project, and auth token to be valid. When any is missing (e.g. Vercel
  // projects before SENTRY_ORG was set), attempting the upload fails
  // loudly mid-build ("Project not found", "projects are invalid").
  // Gate instead: runtime DSN telemetry is unaffected; upload only runs
  // when fully configured.
  const uploadConfigured = Boolean(
    SENTRY_ORG && process.env.SENTRY_AUTH_TOKEN,
  );

  const base = {
    silent: true,
    widenClientFileUpload: false,
    tunnelRoute: "/monitoring",
    webpack: {
      treeshake: { removeDebugLogging: true },
      reactComponentAnnotation: { enabled: true },
    },
  };

  if (!uploadConfigured) {
    return withSentryConfig(nextConfig, base);
  }

  return withSentryConfig(nextConfig, {
    ...base,
    org: SENTRY_ORG,
    project,
    authToken: process.env.SENTRY_AUTH_TOKEN || "",
  });
}
