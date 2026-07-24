import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { ThemeWrapper } from "@/components/providers/theme-wrapper";
import { ThemeBootstrap } from "@/components/providers/theme-bootstrap";
import { CurrencyProvider } from "@/contexts/currency-context";
import type { CurrencyCode } from "@/lib/currency";
import { FeatureFlagProvider } from "@/components/providers/feature-flag-provider";
import { getFeatureFlags } from "@/lib/feature-flags";
import { CookieConsent } from "@/components/cookie-consent";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { Toaster } from "sonner";
import { ChatAssistantClient as ChatAssistant } from "@/components/chat-assistant-client";
import { CurrencyOverride } from "@/components/currency-override";
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
    default: "Syntaxure Labs | Custom Websites, SaaS Platforms & AI",
    template: "%s | Syntaxure Labs",
  },
  description:
    "Syntaxure Labs is a custom development agency specializing in high-performance websites, SaaS platforms, cloud infrastructure, and secure AI integration. Creators of Context Engine for AI governance.",
  keywords: [
    "global digital transformation agency",
    "custom software development company",
    "SaaS architecture",
    "AI governance",
    "Context Engine",
    "offshore software development",
    "Syntaxure Labs",
    "B2B software solutions",
    "enterprise AI integration",
    "workflow automation",
    "Iloilo web development agency",
  ],
  authors: [{ name: "Syntaxure Labs" }],
  creator: "Syntaxure Labs",
  metadataBase: new URL("https://www.syntaxure.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.syntaxure.dev",
    siteName: "Syntaxure Labs",
    title: "Syntaxure Labs | Custom Websites, SaaS Platforms & AI",
    description:
      "Custom website development, SaaS platforms, cloud infrastructure, and secure AI integration. We build high-performance digital solutions for businesses ready to scale.",
    images: [
      {
        url: "/syntaxure-business-card.png",
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
    title: "Syntaxure Labs | Custom Websites, SaaS Platforms & AI",
    description:
      "Custom website development, SaaS platforms, and AI integration. We build high-performance digital solutions on modern web infrastructure.",
    images: ["/syntaxure-business-card.png"],
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
  themeColor: "#06b6d4",
};

/**
 * ROOT LAYOUT
 * -----------
 * The foundational shell for the entire application.
 * - Applies the "Endgame" dark void aesthetic (#050505)
 * - Uses native browser scrolling for optimal performance
 * - Renders the global grid/spotlight background
 */
/**
 * Detect the user's currency server-side.
 * Priority: 1) Cookie > 2) Geo header (Vercel) > 3) Accept-Language > 4) Default USD
 *
 * On Vercel production, x-vercel-ip-country detects actual visitor location.
 * On localhost, falls back to browser language (Accept-Language).
 * Use ?currency=USD or ?currency=PHP in the URL to test different currencies.
 */
async function detectCurrency(): Promise<CurrencyCode> {
  // 0. URL param override (set via client CurrencyOverride component)
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get("currency")?.value;
  if (cookieVal === "PHP" || cookieVal === "USD") return cookieVal;

  // 1. Vercel geo header (accurate country detection on production)
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country")?.toUpperCase();
  if (country === "PH") return "PHP";

  // 2. Accept-Language header (fallback for localhost)
  const acceptLang = headersList.get("accept-language") || "";
  const phLocales = ["tl", "fil", "en-ph", "ceb", "hil", "ilo"];
  const isPhilippines = phLocales.some((l) => acceptLang.toLowerCase().includes(l));
  if (isPhilippines) return "PHP";

  // 3. Default
  return "USD";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch feature flags + detect currency server-side
  const [featureFlags, initialCurrency] = await Promise.all([
    getFeatureFlags(),
    detectCurrency(),
  ]);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <AnalyticsProvider />
        <ThemeBootstrap />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-[#050505] dark:text-slate-100 antialiased font-sans selection:bg-cyan-500/30 selection:text-white">
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
        <ThemeWrapper>
          <FeatureFlagProvider flags={featureFlags}>
            <CurrencyProvider initialCurrency={initialCurrency}>
              <CurrencyOverride />
              <div className="relative z-10 min-h-screen flex flex-col">
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "Organization",
                      "@id": "https://www.syntaxure.dev/",
                      name: "Syntaxure Labs",
                      image: "https://www.syntaxure.dev/syntaxure-business-card.png",
                      url: "https://www.syntaxure.dev",
                      logo: "https://www.syntaxure.dev/favicon.svg",
                      description: "Syntaxure Labs is a global B2B digital transformation agency specializing in scalable custom software, web architectures, and secure AI integrations. Creators of Context Engine for AI governance.",
                      address: {
                        "@type": "PostalAddress",
                        streetAddress: "Iloilo City",
                        addressLocality: "Iloilo City",
                        addressRegion: "Western Visayas",
                        postalCode: "5000",
                        addressCountry: "PH",
                      },
                      geo: {
                        "@type": "GeoCoordinates",
                        latitude: 10.6969,
                        longitude: 122.5483,
                      },
                      openingHoursSpecification: [
                        {
                          "@type": "OpeningHoursSpecification",
                          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                          opens: "09:00",
                          closes: "18:00",
                        },
                      ],
                      telephone: "+63 970 576 2593",
                      email: "contact@syntaxure.dev",
                      priceRange: "$$$",
                      areaServed: ["Global", "Philippines", "Iloilo City"],
                      contactPoint: {
                        "@type": "ContactPoint",
                        telephone: "+63 970 576 2593",
                        contactType: "customer service",
                        email: "contact@syntaxure.dev",
                        areaServed: "Global",
                        availableLanguage: ["English", "Tagalog"],
                      },
                      sameAs: [
                        "https://www.linkedin.com/company/syntaxure-labs",
                        "https://www.facebook.com/people/Syntaxure-Labs-PH/61590058783641/",
                      ],
                      makesOffer: [
                        {
                          "@type": "Offer",
                          itemOffered: {
                            "@type": "Service",
                            name: "Digital Transformation & Custom Software",
                            description: "Modernizing enterprise operations by converting manual workflows into scalable custom software, high performance marketing websites, and mobile applications."
                          }
                        },
                        {
                          "@type": "Offer",
                          itemOffered: {
                            "@type": "SoftwareApplication",
                            name: "Context Engine",
                            applicationCategory: "BusinessApplication",
                            operatingSystem: "Any",
                            description: "A proprietary AI Governance layer that forces AI agents to adhere to established protocols and actively prevents AI hallucinations in enterprise environments."
                          }
                        }
                      ]
                    }),
                  }}
                />
                {children}
              </div>
            </CurrencyProvider>
          </FeatureFlagProvider>
        </ThemeWrapper>

        {/* Vercel Analytics - Web Vitals Tracking */}
        <Analytics />
        <CookieConsent />
        <Toaster
          theme="system"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-surface, #0a0a0a)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
              color: "var(--color-ink, #ededed)",
            },
          }}
        />
        <ChatAssistant
          apiEndpoint="/api/assistant"
          title="AI Assistant"
          welcomeMessage="Hi! How can we help you today? Ask about our services, pricing, or process."
          suggestions={[
            "What services do you offer?",
            "How does your pricing work?",
            "What is Context Engine?",
          ]}
        />
      </body>
    </html>
  );
}
