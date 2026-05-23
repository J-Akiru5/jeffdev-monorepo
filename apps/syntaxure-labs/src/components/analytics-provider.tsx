'use client';

import * as React from 'react';
import Script from 'next/script';

export function AnalyticsProvider() {
  const [consentGiven, setConsentGiven] = React.useState(false);
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  React.useEffect(() => {
    // Check if user has explicitly accepted cookies
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      setConsentGiven(true);
    }
  }, []);

  if (!consentGiven || !measurementId) return null;

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
