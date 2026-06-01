"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
    <html>
      <head>
        <style>{`
          @media (prefers-color-scheme: light) {
            body { background: #f6f7fb; color: #0b0f14; }
            body button { border-color: rgba(15,23,42,0.2); color: #0b0f14; }
            body p { color: #52525b; }
          }
        `}</style>
      </head>
      <body style={{
        margin: 0,
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#ededed",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>500</h1>
          <p style={{ color: "#888", marginBottom: "2rem" }}>
            Something went wrong. Our team has been notified.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "8px",
              border: "1px solid #333",
              background: "transparent",
              color: "#ededed",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
