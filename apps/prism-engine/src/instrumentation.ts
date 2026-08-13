/**
 * Next.js instrumentation hook.
 *
 * `@sentry/nextjs` v10 no longer auto-loads `sentry.server.config.ts` /
 * `sentry.edge.config.ts` — they're only picked up via this file's
 * `register()`. Without it, those two configs are dead code and
 * server-side errors never reach Sentry.
 *
 * Required to live under `src/` because this app has a `src/` directory —
 * Next.js only looks for `instrumentation.ts` at the project root or in
 * `src/`, never both.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
