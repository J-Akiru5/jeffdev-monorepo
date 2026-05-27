"use client";

import Link from "next/link";
import { useInView } from "@/lib/use-in-view";
import { ArrowUpRight, Cpu, Shield, Zap } from "lucide-react";

const highlights = [
  {
    icon: Cpu,
    title: "Context-as-a-Service",
    description: "Deploy a server that forces AI coding tools to follow your design system.",
  },
  {
    icon: Shield,
    title: "Zero Hallucination",
    description: "Eliminate AI-generated code that doesn't match your architecture.",
  },
  {
    icon: Zap,
    title: "50% Fewer Tokens",
    description: "Constrain output to your rules and cut API costs significantly.",
  },
];

export function PrismHighlight() {
  const { ref: sectionRef, isInView } = useInView({ rootMargin: "-100px" });

  return (
    <section ref={sectionRef} className="section-padding bg-slate-50/50" id="prism">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(15px)",
              transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
            }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 font-mono text-xs uppercase tracking-wider text-purple-700">
              Our Flagship Product
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Prism{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">
                Context Engine
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Born from our own engineering needs. Prism is the context layer
              your AI coding assistant has been missing — and it&apos;s built
              with the same quality we bring to every client project.
            </p>

            <div className="mt-8 space-y-4">
              {highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.title} className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{h.title}</h4>
                      <p className="text-sm text-slate-500">{h.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/prism"
              className="btn-primary-light group mt-8 inline-flex"
            >
              Learn_More_About_Prism
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div
            className="hidden lg:block"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s",
            }}
          >
            <div className="mockup-frame">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: "#ef4444" }} />
                <div className="mockup-dot" style={{ background: "#eab308" }} />
                <div className="mockup-dot" style={{ background: "#22c55e" }} />
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  prism — ~/context-server
                </span>
              </div>
              <div className="mockup-body font-mono text-sm leading-relaxed text-slate-700">
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-purple-600">$</span>
                  <span>curl -X POST /context \</span>
                </div>
                <div className="mb-2 text-xs text-slate-400">
                  &nbsp;&nbsp;-d &apos;{`{"prompt": "build a button"}`}&apos;
                </div>
                <div className="h-px bg-slate-100 my-3" />
                <div className="space-y-1.5">
                  <div>
                    <span className="text-cyan-600">→</span>{" "}
                    <span className="text-slate-500">Applying design tokens...</span>
                  </div>
                  <div>
                    <span className="text-cyan-600">→</span>{" "}
                    <span className="text-slate-500">Matching component library...</span>
                  </div>
                  <div>
                    <span className="text-emerald-600">✓</span>{" "}
                    <span className="text-slate-900 font-semibold">
                      Output: Button component matches Design System v2.3
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PrismHighlight;