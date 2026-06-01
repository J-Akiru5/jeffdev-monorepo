import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicNav } from "@/components/layout/public-nav";
import { AnimatedHero } from "@/components/hero";

const PRISM_URL = process.env.NEXT_PUBLIC_PRISM_URL || "https://prism.syntaxure.dev";

export const metadata: Metadata = {
    title: 'Prism Context Engine - The Context Operating System for Agentic Teams',
  description:
    'Record your architecture. AI learns your rules. Deploy context directly to Cursor, Windsurf, and Claude via MCP. Eliminate context pollution forever.',
  keywords: [
    'MCP server',
    'Model Context Protocol',
    'Cursor AI',
    'Windsurf AI',
    'Claude Code',
    'AI coding assistant',
    'context governance',
    'architectural rules',
    'design system documentation',
    'AI hallucination prevention',
    'code standards enforcement',
  ],
  openGraph: {
      title: 'Prism Context Engine - The Context Operating System for Agentic Teams',
    description:
      'Record your architecture. AI learns your rules. Deploy to your IDE via MCP. Eliminate context pollution.',
    url: '/',
    siteName: 'Prism Context Engine',
    images: [
      {
        url: '/prism-icon.png',
        width: 1200,
        height: 630,
        alt: 'Prism Context Engine',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prism Context Engine - The Context Operating System',
    description: 'Record your architecture. AI learns your rules. Deploy to your IDE via MCP.',
    images: ['/prism-icon.png'],
    creator: '@syntaxure_dev',
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Prism Context Engine",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Web, macOS, Windows, Linux",
            "description":
              "Record your architecture. AI learns your rules. Deploy context directly to Cursor, Windsurf, and Claude via MCP. Eliminate context pollution.",
            "url": PRISM_URL,
            "author": {
              "@type": "Organization",
              "name": "Syntaxure Labs",
              "url": "https://www.syntaxure.dev",
            },
            "offers": [
              {
                "@type": "Offer",
                "name": "Free Tier",
                "price": "0",
                "priceCurrency": "USD",
              },
              {
                "@type": "Offer",
                "name": "Pro Tier",
                "price": "18",
                "priceCurrency": "USD",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "unitText": "month"
                },
              },
              {
                "@type": "Offer",
                "name": "Team Tier",
                "price": "54",
                "priceCurrency": "USD",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "unitText": "month"
                },
              },
            ],
          }),
        }}
      />
      {/* Navigation */}
      <PublicNav />

      {/* Animated Hero Section with ScrollTrigger Pinning */}
      <AnimatedHero />

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] relative z-10 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/prism-icon.png"
                  alt="Prism Context Engine"
                  width={24}
                  height={24}
                />
                <span className="text-gradient-cyan font-bold">
                  Prism Context Engine
                </span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">
                The Context Operating System for developers who ship fast.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 text-sm uppercase tracking-wider">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/pricing"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://docs.syntaxure.dev"
                    target="_blank"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
                  >
                    Docs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 text-sm uppercase tracking-wider">
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="https://www.syntaxure.dev"
                    target="_blank"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
                  >
                    About Syntaxure Labs
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.syntaxure.dev/contact"
                    target="_blank"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 text-sm uppercase tracking-wider">
                Get Started
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Ready to eliminate context pollution?
              </p>
              <Link
                href="/sign-up"
                className="inline-block bg-blue-600 dark:glass !text-white dark:!text-[var(--text-primary)] px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider shadow-[0_2px_8px_rgba(37,99,235,0.3)] dark:shadow-none"
              >
                Start Free →
              </Link>
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[var(--text-tertiary)] text-xs font-mono">
              © {new Date().getFullYear()} Syntaxure Labs. Built with Prism
              Context Engine.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link
                href="/terms"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-xs transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-xs transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
