import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Syntaxure Labs",
  description:
    "Six pillars that define how we build software — AI-native development, fixed pricing, enterprise security, Socratic planning, rapid MVPs, and post-launch partnership.",
};

export default function FeaturesPage() {
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
                We don&apos;t just write code — we build systems with a
                philosophy. Here&apos;s what makes Syntaxure Labs unlike any
                agency you&apos;ve worked with.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Feature Cards */}
        <section className="px-6 pb-16 lg:px-8">
          <div className="mx-auto max-w-7xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: "ai-native",
                title: "AI-Native Development",
                desc: "Our development pipeline integrates AI agents directly into the IDE, giving them full workspace context to map dependencies, trace issues, and execute tasks end-to-end without human micromanagement. Agents follow the Agentic Protocol — asking clarifying questions before building, validating each layer, and committing with traceable logic notes.",
              },
              {
                id: "fixed-pricing",
                title: "Fixed Investment Pricing",
                desc: "Every project follows a structured Statement of Work with defined milestones, deliverables, and fixed pricing. No hourly billing, no scope creep invoices, no financial anxiety. You know exactly what you pay, exactly what you get, and exactly when you get it — from kickoff to launch.",
              },
              {
                id: "enterprise-security",
                title: "Enterprise-Grade Security",
                desc: "Defense-in-depth with Firebase Authentication, custom session management, role-based access controls, encrypted Firestore collections, and comprehensive audit logging. Every project ships with SOC 2-ready architecture by default — not as an upsell.",
              },
              {
                id: "socratic-planning",
                title: "Socratic Planning",
                desc: "Our Clarification-First Doctrine means every project starts with a structured Q&A loop. We challenge assumptions, map edge cases, surface hidden requirements, and validate the full scope before any engineering begins. This alone saves weeks of rework and eliminates specification drift.",
              },
              {
                id: "rapid-mvp",
                title: "Rapid MVP Delivery",
                desc: "Using proprietary build sequences and pre-built architecture templates, we compress typical 3-month development timelines into 2-3 weeks for functional, polished MVP launches. Each MVP includes auth, database, API layer, and responsive UI — ready for users, not just demos.",
              },
              {
                id: "post-launch",
                title: "Post-Launch Partnership",
                desc: "Every project includes a transition period with documentation handoff and knowledge transfer. Optional retainer packages cover bug fixes, performance optimization, feature iterations, A/B testing infrastructure, and architecture evolution as your user base grows.",
              },
            ].map((feature) => (
              <div
                key={feature.id}
                className="glass-neon glass-shimmer rounded-lg p-8 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/60 mb-4 block">
                  {feature.id.replace("-", " ")}
                </span>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/55">
                  {feature.desc}
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

                {[
                  {
                    aspect: "Pricing",
                    traditional: "Hourly billing, scope creep",
                    syntaxure: "Fixed project investment",
                  },
                  {
                    aspect: "Planning",
                    traditional: "Vague requirements, assumptions",
                    syntaxure: "Socratic Q&A, zero assumptions",
                  },
                  {
                    aspect: "Security",
                    traditional: "Basic auth, no RBAC",
                    syntaxure: "Defense-in-depth, audit-ready",
                  },
                  {
                    aspect: "AI Usage",
                    traditional: "Copy-paste from ChatGPT",
                    syntaxure: "IDE-native agents with full context",
                  },
                  {
                    aspect: "Timeline",
                    traditional: "3-6 months for MVP",
                    syntaxure: "2-3 weeks for MVP",
                  },
                  {
                    aspect: "Post-Launch",
                    traditional: "Handoff and goodbye",
                    syntaxure: "Retainer partnership, growth roadmap",
                  },
                ].map((row, idx) => (
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
