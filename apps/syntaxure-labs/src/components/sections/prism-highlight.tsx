import Link from "next/link";
import { Reveal } from "@/components/reveal";
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
  return (
    <section id="prism" className="py-24 md:py-32 border-y border-[var(--border-subtle)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* ── Left Content ── */}
          <Reveal threshold={0.1} transitionClassName="duration-1000 ease-out">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] shadow-sm">
              Our Flagship Product
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl">
              Prism Context Engine
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
              {cmsData?.description || "Born from our own engineering needs. Prism is the context layer your AI coding assistant has been missing. Built with the same precision we bring to every client project."}
            </p>

            <div className="mt-10 space-y-6">
              {highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.title} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-sm">
                      <Icon className="h-5 w-5 text-[var(--text-primary)]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{h.title}</h4>
                      <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">{h.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/prism"
              className="mt-10 inline-flex items-center gap-2 rounded-md bg-[var(--text-primary)] px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-[var(--bg-primary)] transition-transform hover:scale-[0.98] active:scale-95 shadow-md"
            >
              Learn_More_About_Prism
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>

          {/* ── Right Content: Code Snippet ── */}
          <Reveal
            className="hidden lg:block relative"
            threshold={0.1}
            transitionClassName="duration-1000 ease-out delay-200"
          >
            {/* ── Ambient Technical Glow (Cyan Only) ── */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 blur-[80px] pointer-events-none select-none opacity-40 dark:opacity-60">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-full" />
            </div>

            <div className="relative rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 font-mono text-[10px] font-bold text-[var(--text-tertiary)]">
                  prism — ~/context-server
                </span>
              </div>
              <div className="p-6 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[var(--text-tertiary)]">$</span>
                  <span className="text-[var(--text-primary)]">curl -X POST /context \</span>
                </div>
                <div className="mb-4 text-[var(--text-primary)]">
                  &nbsp;&nbsp;-d &apos;{`{"prompt": "build a button"}`}&apos;
                </div>
                <div className="h-px bg-[var(--border-subtle)] my-4" />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-[var(--text-tertiary)]">→</span>{" "}
                    <span>Applying design tokens...</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[var(--text-tertiary)]">→</span>{" "}
                    <span>Matching component library...</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[var(--text-primary)] font-bold">✓</span>{" "}
                    <span className="text-[var(--text-primary)] font-bold">
                      Output: Button component matches Design System v2.3
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default PrismHighlight;