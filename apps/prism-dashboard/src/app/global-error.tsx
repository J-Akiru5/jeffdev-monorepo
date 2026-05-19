'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

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
      <body>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          textAlign: 'center', background: '#0a0a0f', color: '#fff',
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>500</h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            Something went wrong. Our team has been notified.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 2rem', borderRadius: '8px',
              border: '1px solid #333', background: 'transparent',
              color: '#fff', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
