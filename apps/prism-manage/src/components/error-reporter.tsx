"use client";

/**
 * ErrorReporter
 * -------------
 * Drop-in client component for route error boundaries: reports the error to
 * Sentry exactly once per error. No-ops when Sentry isn't configured (empty
 * DSN), so it's safe everywhere.
 */

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export function ErrorReporter({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return null;
}
