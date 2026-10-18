"use client";

/**
 * Global error boundary
 * ---------------------
 * Catches errors that escape every other boundary (including the root
 * layout) and reports them to Sentry. Renders its own <html>/<body>, so it
 * uses inline styles — the app's CSS may not be available at this level.
 */

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0A0D12",
          color: "#E6EAF0",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: "#8B93A3", marginBottom: 8 }}>
            The app hit an unexpected error. It has been reported — please try
            again.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                color: "#5A6272",
                fontFamily: "monospace",
                marginBottom: 16,
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: "#22D3EE",
              color: "#04121a",
              border: 0,
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
