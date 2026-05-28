import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { CurrencyProvider } from "@/contexts/currency-context";
import { FeatureFlagProvider } from "@/components/providers/feature-flag-provider";
import { getFeatureFlags } from "@/lib/feature-flags";
import { CookieConsent } from "@/components/cookie-consent";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { ChatAssistant } from "@syntaxure/ui/chat-assistant";
import { Toaster } from "sonner";
import "./globals.css";

/**
 * TYPOGRAPHY SYSTEM
 * -----------------
 * Inter: Primary sans-serif for headings and body text.
 * JetBrains Mono: Technical font for code, data, and tags.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * METADATA CONFIGURATION
 * ----------------------
 * SEO-optimized defaults for Syntaxure Labs.
 * Uses B2B language and professional positioning.
 */
export const metadata: Metadata = {
  title: {
    default: "Syntaxure Labs — Enterprise Web Development & SaaS Solutions",
    template: "%s // Syntaxure Labs",
  },
  description:
    "We build high-performance web applications, scalable SaaS platforms, and cloud infrastructure for startups and enterprises. Next.js, Firebase, and AI-powered solutions.",
  keywords: [
    "web development agency",
    "SaaS development",
    "Next.js development",
    "enterprise web solutions",
    "cloud architecture",
    "Syntaxure Labs",
    "custom web application development Philippines",
    "SaaS development agency",
    "Next.js agency for startups",
    "web development Iloilo",
    "fixed-price web development",
    "AI-native development agency",
    "startup MVP development",
  ],
  authors: [{ name: "Syntaxure Labs" }],
  creator: "Syntaxure Labs",
  metadataBase: new URL("https://www.syntaxure.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.syntaxure.dev",
    siteName: "Syntaxure Labs",
    title: "Syntaxure Labs — Enterprise Web Development & SaaS Solutions",
    description:
      "We build high-performance web applications, scalable SaaS platforms, and cloud infrastructure for startups and enterprises.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Syntaxure Labs",
      },
      {
        url: "/favicon/og-image.png",
        width: 1200,
        height: 630,
        alt: "Syntaxure Labs",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Syntaxure Labs — Enterprise Web Development & SaaS Solutions",
    description:
      "We build high-performance web applications, scalable SaaS platforms, and cloud infrastructure for startups and enterprises.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  themeColor: "#1c2124",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const storageKey = 'syntaxure-theme';
    const stored = localStorage.getItem(storageKey);
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersLight ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.toggle('theme-light', theme === 'light');
    root.dataset.theme = theme;
  } catch (error) {
    console.warn('Theme bootstrap failed', error);
  }
})();`,
          }}
        />
      </head>
      <body className="bg-void text-white antialiased font-sans selection:bg-cyan-500/30 selection:text-white">
        {/* Global Grid Background */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          {/* Radial spotlight gradient */}
          <div
            className="absolute inset-0"
            style={{ background: "var(--overlay-spotlight)" }}
          />

          {/* Grid pattern overlay */}
          <div className="grid-overlay absolute inset-0" />

          {/* Noise texture for depth */}
          <div
            className="absolute inset-0 bg-noise"
            style={{ opacity: "var(--overlay-noise-opacity)" }}
          />
        </div>

        {/* Application Content */}
        <SmoothScroll>
          <FeatureFlagProvider flags={featureFlags}>
            <CurrencyProvider>
              <div className="relative z-10 min-h-screen flex flex-col">
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "ProfessionalService",
                      name: "Syntaxure Labs",
                      
                      url: "https://www.syntaxure.dev",
                      logo: "https://www.syntaxure.dev/favicon.svg",
                      contactPoint: {
                        "@type": "ContactPoint",
                        telephone: "+63-951-916-7103",
                        contactType: "customer service",
                        email: "contact@syntaxure.dev",
                        areaServed: "Global",
                        availableLanguage: ["English", "Tagalog"],
                      },
                    }),
                  }}
                />
                {children}
              </div>
            </CurrencyProvider>
          </FeatureFlagProvider>
        </SmoothScroll>

        {/* Vercel Analytics - Web Vitals Tracking */}
        <Analytics />
        <CookieConsent />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          }}
        />
        <ChatAssistant
          apiEndpoint="/api/assistant"
          title="Syntaxure Labs System Assistant"
          welcomeMessage="How can I help you understand the Syntaxure Labs ecosystem today?"
          suggestions={[
            "What is the difference between Syntaxure Labs and Prism?",
            "What is the turborepo structure?",
            "What is the Doppler Law?",
          ]}
        />
      </body>
    </html>
  );
}
