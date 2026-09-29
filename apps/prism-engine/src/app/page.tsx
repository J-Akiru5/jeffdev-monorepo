import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";
import {
  AgentCoverage,
  BackToTop,
  DispersionField,
  EnforcementDemo,
  EvidenceLedger,
  FeatureGrid,
  FinalCta,
  HowItWorks,
  LandingFooter,
  LandingHero,
  PricingStrip,
  ProductSurface,
} from "@/components/landing";
import { metadata as contentMetadata, pricing } from "@/components/landing/content";

const PRISM_URL = process.env.NEXT_PUBLIC_PRISM_URL || "https://prism.syntaxure.dev";

export const metadata: Metadata = {
  title: contentMetadata.title,
  description: contentMetadata.description,
  keywords: [
    "MCP server",
    "Model Context Protocol",
    "Cursor AI",
    "Windsurf AI",
    "Claude Code",
    "AI coding assistant",
    "context governance",
    "architectural rules",
    "design system documentation",
    "AI hallucination prevention",
    "code standards enforcement",
  ],
  openGraph: {
    title: contentMetadata.title,
    description: contentMetadata.description,
    url: contentMetadata.url,
    siteName: "Prism Context Engine",
    images: [
      {
        url: "/prism-icon.png",
        width: 1200,
        height: 630,
        alt: "Prism Context Engine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prism Context Engine",
    description: contentMetadata.description,
    images: ["/prism-icon.png"],
    creator: "@syntaxure_dev",
  },
  alternates: {
    canonical: "/",
  },
};

/**
 * The landing page, in reading order:
 *
 *   hero → the block → the product → capabilities → setup → coverage →
 *   evidence → pricing → start
 *
 * The order is the argument. It answers "what is this", then shows enforcement
 * firing, then shows the surface it all feeds, before claiming anything, and
 * only then states what is verified and what is not. `content.ts` holds every
 * string; the components below only arrange them.
 */
export default function HomePage() {
  return (
    /* `relative` is not decorative: the scroll-linked sections inside resolve
       their scroll offsets against the nearest positioned ancestor, and without
       it framer-motion warns that the offsets may be measured against the wrong
       box. It also gives the fixed dispersion field a defined containing block. */
    <main className="relative flex min-h-screen flex-col">
      {/* JSON-LD structured data. Offers are derived from the same pricing source
          the pricing page reads — they previously advertised $18/$54 while the
          pricing page showed $8/$7. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Prism Context Engine",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web, macOS, Windows, Linux",
            description: contentMetadata.description,
            url: PRISM_URL,
            author: {
              "@type": "Organization",
              name: "Syntaxure Labs",
              url: "https://www.syntaxure.dev",
            },
            offers: pricing
              .filter((plan) => plan.monthlyUsd !== null)
              .map((plan) => ({
                "@type": "Offer",
                name: `${plan.name} Tier`,
                price: String(plan.monthlyUsd),
                priceCurrency: "USD",
                ...(plan.monthlyUsd && plan.monthlyUsd > 0
                  ? {
                      priceSpecification: {
                        "@type": "UnitPriceSpecification",
                        unitText: "month",
                      },
                    }
                  : {}),
              })),
          }),
        }}
      />

      {/* The atmosphere. Fixed behind everything, pure CSS, no JavaScript. */}
      <DispersionField />

      <PublicNav />

      <LandingHero />
      <EnforcementDemo />
      <ProductSurface />
      <FeatureGrid />
      <HowItWorks />
      <AgentCoverage />
      <EvidenceLedger />
      <PricingStrip />
      <FinalCta />

      <LandingFooter />

      {/* Floating return control, rendered last so it sits above the sections
          without needing a higher z-index than the fixed navigation. */}
      <BackToTop />
    </main>
  );
}
