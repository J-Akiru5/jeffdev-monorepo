import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SmoothScroll } from '@/components/providers/smooth-scroll';
import { CurrencyProvider } from '@/contexts/currency-context';
import { FeatureFlagProvider } from '@/components/providers/feature-flag-provider';
import { getFeatureFlags } from '@/lib/feature-flags';
import { CookieConsent } from '@/components/cookie-consent';
import { AnalyticsProvider } from '@/components/analytics-provider';
import './globals.css';

/**
 * TYPOGRAPHY SYSTEM
 * -----------------
 * Inter: Primary sans-serif for headings and body text.
 * JetBrains Mono: Technical font for code, data, and tags.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

/**
 * METADATA CONFIGURATION
 * ----------------------
 * SEO-optimized defaults for JeffDev Agency.
 * Uses B2B language and professional positioning.
 */
export const metadata: Metadata = {
  title: {
    default: 'JD Studio — Enterprise Web Development & SaaS Solutions',
    template: '%s // JD Studio',
  },
  description:
    'We build high-performance web applications, scalable SaaS platforms, and cloud infrastructure for startups and enterprises. Next.js, Firebase, and AI-powered solutions.',
  keywords: [
    'web development agency',
    'SaaS development',
    'Next.js development',
    'enterprise web solutions',
    'cloud architecture',
    'JD Studio',
  ],
  authors: [{ name: 'JD Studio' }],
  creator: 'JeffDev Web Development Services',
  metadataBase: new URL('https://jeffdev.studio'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jeffdev.studio',
    siteName: 'JD Studio',
    title: 'JD Studio — Enterprise Web Development & SaaS Solutions',
    description:
      'We build high-performance web applications, scalable SaaS platforms, and cloud infrastructure for startups and enterprises.',
    images: [
      {
        url: '/favicon/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JD Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JD Studio — Enterprise Web Development & SaaS Solutions',
    description:
      'We build high-performance web applications, scalable SaaS platforms, and cloud infrastructure for startups and enterprises.',
    images: ['/favicon/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: '#1c2124',
  icons: {
    icon: [
      { url: '/favicon.svg' },
      { url: '/favicon/icon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/apple-icon.png',
  },
};

/**
 * ROOT LAYOUT
 * -----------
 * The foundational shell for the entire application.
 * - Applies the "Endgame" dark void aesthetic (#050505)
 * - Provides smooth scrolling via Lenis
 * - Renders the global grid/spotlight background
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch feature flags server-side
  const featureFlags = await getFeatureFlags();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <AnalyticsProvider />
      </head>
      <body className="bg-void text-white antialiased font-sans selection:bg-cyan-500/30 selection:text-white">
        {/* Global Grid Background */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          {/* Radial spotlight gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),transparent)]" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M0 0h60v60H0z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Noise texture for depth */}
          <div className="absolute inset-0 bg-noise opacity-[0.02]" />
        </div>

        {/* Application Content */}
        <SmoothScroll>
          <FeatureFlagProvider flags={featureFlags}>
            <CurrencyProvider>
              <div className="relative z-10 min-h-screen flex flex-col">
                {children}
              </div>
            </CurrencyProvider>
          </FeatureFlagProvider>
        </SmoothScroll>

        {/* Vercel Analytics - Web Vitals Tracking */}
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  );
}
