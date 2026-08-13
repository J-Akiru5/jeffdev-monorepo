import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { FEATURES_DEFAULTS } from "@/data/cms-defaults";

export const metadata: Metadata = {
  title: "Why Syntaxure Labs",
  description:
    "Six core strengths built into every project: multi-user support, built-in security, fast delivery, AI readiness, clear pricing, and continuous improvement.",
};

export const revalidate = 60;

export default async function FeaturesPage() {
  const cms = await getPageContent("features");
  const content = { ...FEATURES_DEFAULTS, ...cms };

  const features = content.features?.length > 0
    ? content.features
    : FEATURES_DEFAULTS.features;

  const comparison = content.comparison?.length > 0
    ? content.comparison
    : FEATURES_DEFAULTS.comparison;

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Page Header */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="mt-8 max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wider text-purple-400">
                {"// Why Choose Us"}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Built Different.{" "}
                <span className="text-gradient-holographic">
                  Engineered Better.
                </span>
              </h1>
              <p className="mt-4 text-lg text-white/50">
                {content.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Feature Cards */}
        <section className="px-6 pb-16 lg:px-8">
          <div className="mx-auto max-w-7xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature: { id?: string; title: string; description: string }) => (
              <div
                key={feature.id || feature.title}
                className="glass-neon glass-shimmer rounded-lg p-8 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/60 mb-4 block">
                  {(feature.id || feature.title).replace("-", " ")}
                </span>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/55">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                {"// The Difference"}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
                Traditional Agency vs.{" "}
                <span className="text-gradient-holographic">
                  Syntaxure Labs
                </span>
              </h2>
            </div>

            {/* Glass Table */}
            <div className="glass-neon rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 text-sm">
                {/* Header Row */}
                <div className="p-4 font-mono uppercase tracking-wider text-white/40 text-xs">
                  Aspect
                </div>
                <div className="p-4 font-mono uppercase tracking-wider text-white/30 text-xs">
                  Traditional Agency
                </div>
                <div className="p-4 font-mono uppercase tracking-wider text-cyan-400 text-xs border-l border-white/5">
                  Syntaxure Labs
                </div>

                {comparison.map((row: { aspect: string; traditional: string; syntaxure: string }, idx: number) => (
                  <div
                    key={row.aspect}
                    className={`contents ${idx % 2 === 0 ? "bg-white/[0.01]" : ""}`}
                  >
                    <div className="p-4 text-white/80 font-medium border-t border-white/5">
                      {row.aspect}
                    </div>
                    <div className="p-4 text-white/40 border-t border-white/5">
                      {row.traditional}
                    </div>
                    <div className="p-4 text-cyan-400/80 border-t border-white/5 border-l border-white/5">
                      {row.syntaxure}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
