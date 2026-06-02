import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { LEGAL_DEFAULTS } from "@/data/cms-defaults";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { CmsFallbackIndicator } from "@/components/ui/cms-fallback-indicator";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Syntaxure Labs.",
};

export const revalidate = 60;

export default async function TermsPage() {
  const cms = await getPageContent("legal");
  const isCmsLoaded = !!cms?.termsOfService;
  const lastUpdated = cms?.termsOfService?.lastUpdated || LEGAL_DEFAULTS.termsOfService.lastUpdated;
  const content = cms?.termsOfService?.content || LEGAL_DEFAULTS.termsOfService.content;

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <h1 className="mt-8 text-4xl font-bold tracking-tight text-white">
              Terms of Service
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">
              Last updated: {lastUpdated}
            </p>

            {!isCmsLoaded && <CmsFallbackIndicator pageSlug="legal" />}

            <MarkdownRenderer content={content} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
