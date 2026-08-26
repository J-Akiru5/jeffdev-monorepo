/**
 * Shared error logger (Phase 5 monitoring).
 *
 * Replaces bare console.error at genuine error paths so handled failures
 * actually reach Sentry instead of dying in Vercel runtime logs. Every call
 * still writes to the console — local dev output is preserved exactly, and
 * call sites keep their original argument shapes verbatim.
 *
 * Usage (variadic, mirrors console.error):
 *   logError("generate", err);
 *   logError("generate", "Gemini API error:", err);
 *   logError("paypal-webhook", "Failed to mark event:", err, { id });
 *
 * Behaviour:
 *  - Anything that is an Error becomes the captured exception (first one wins).
 *  - Strings are joined into the console line and used as fallback message
 *    when no Error object is present.
 *  - Plain objects become Sentry `extra` context.
 *  - Scope becomes a Sentry tag for filtering.
 *  - No-op to Sentry when no DSN is configured (local dev).
 */

import * as Sentry from "@sentry/nextjs";

function hasDsn(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function logError(scope: string, ...args: unknown[]): void {
  // Preserve existing console behaviour exactly.
  console.error(...args);

  if (!hasDsn()) return;

  let exception: Error | undefined;
  const extras: Record<string, unknown> = {};
  const messages: string[] = [];

  args.forEach((arg, i) => {
    if (arg instanceof Error) {
      exception ??= arg;
      return;
    }
    if (typeof arg === "string") {
      messages.push(arg);
      return;
    }
    if (arg !== undefined && arg !== null) {
      extras[`arg${i}`] = arg;
      messages.push(safeStringify(arg));
    }
  });

  Sentry.captureException(exception ?? new Error(messages.join(" ") || scope), {
    tags: { scope },
    ...(Object.keys(extras).length > 0 ? { extra: extras } : {}),
    ...(messages.length > 0 ? { message: messages.join(" ") } : {}),
  });
}
