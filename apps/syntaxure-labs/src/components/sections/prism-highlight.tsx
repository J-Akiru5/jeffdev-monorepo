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

export function PrismHighlight({ cmsData }: { cmsData?: { description?: string } }) {
  const { ref: sectionRef, isInView } = useInView({ rootMargin: "-100px" });

  return (
    <section ref={sectionRef} className="section-padding bg-[#0a0a0a] border-y border-white/5" id="prism">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(15px)",
              transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
            }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-purple-400">
              Our Flagship Product
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Prism{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">
                Context Engine
              </span>
            </h2>
            <p className="mt-4 text-lg text-white/60">
              {cmsData?.description || "Born from our own engineering needs. Prism is the context layer your AI coding assistant has been missing — and it's built with the same quality we bring to every client project."}
            </p>

            <div className="mt-8 space-y-4">
              {highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.title} className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{h.title}</h4>
                      <p className="text-sm text-white/50">{h.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/prism"
              className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-md border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] active:scale-95"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative z-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white">
                Learn_More_About_Prism
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
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
            <div className="border border-white/10 bg-white/5 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
                <span className="ml-2 font-mono text-[11px] text-white/40">
                  prism — ~/context-server
                </span>
              </div>
              <div className="p-5 bg-black/25 font-mono text-xs sm:text-sm leading-relaxed text-white/70">
                <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                  <span className="text-purple-400">$</span>
                  <span>curl -X POST /context \</span>
                </div>
                <div className="mb-2 text-xs text-white/40">
                  &nbsp;&nbsp;-d &apos;{`{"prompt": "build a button"}`}&apos;
                </div>
                <div className="h-px bg-white/5 my-3" />
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-cyan-400">→</span>{" "}
                    <span className="text-white/50">Applying design tokens...</span>
                  </div>
                  <div>
                    <span className="text-cyan-400">→</span>{" "}
                    <span className="text-white/50">Matching component library...</span>
                  </div>
                  <div>
                    <span className="text-emerald-400">✓</span>{" "}
                    <span className="text-white font-semibold">
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