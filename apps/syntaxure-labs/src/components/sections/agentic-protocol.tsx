"use client";

import {
  Database,
  Shield,
  Code,
  Palette,
  Sparkles,
  type LucideIcon,
  ChevronRight,
} from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { HoverCard } from "@syntaxure/ui";

type ProtocolPillar = {
  id: string;
  numeral: string;
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
};

type BuildPhase = {
  phase: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const pillars: ProtocolPillar[] = [
  {
    id: "autonomy",
    numeral: "I",
    title: "We Solve Problems End-to-End",
    description:
      "From planning to launch, we handle every part of the build so nothing falls through the cracks.",
    points: [
      "Full project ownership",
      "One team from start to finish",
      "Works with your existing tools",
    ],
    icon: Sparkles,
  },
  {
    id: "clarification",
    numeral: "II",
    title: "Total Alignment",
    description:
      "We validate requirements and map out the blueprint clearly upfront, ensuring no wasted development hours or surprise revisions later.",
    points: [
      "Clear requirements first",
      "No guesswork",
      "Saves time and budget",
    ],
    icon: Shield,
  },
  {
    id: "sequence",
    numeral: "III",
    title: "We Build in the Right Order",
    description:
      "We start with the foundation, then security, then features — so everything is solid and reliable.",
    points: [
      "Data structure first",
      "Security built in",
      "Clean, tested code",
    ],
    icon: Database,
  },
  {
    id: "hitl",
    numeral: "IV",
    title: "You Stay in Control",
    description:
      "You review and approve each phase before we move forward — no surprises.",
    points: [
      "Checkpoints at every step",
      "Transparent progress",
      "Your approval required",
    ],
    icon: Code,
  },
];

const buildSequence: BuildPhase[] = [
  {
    phase: "Step 1",
    title: "Structure the Foundation",
    description: "We set up your data structure and core systems first.",
    icon: Database,
  },
  {
    phase: "Step 2",
    title: "Add Security",
    description: "Login, permissions, and data protection come next.",
    icon: Shield,
  },
  {
    phase: "Step 3",
    title: "Build the Features",
    description: "We develop the actual functionality your users will interact with.",
    icon: Code,
  },
  {
    phase: "Step 4",
    title: "Design the Interface",
    description: "The visual layer is built last, once everything underneath works perfectly.",
    icon: Palette,
  },
];

export function AgenticProtocol() {
  const { ref: headerRef, isInView: headerInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: pillarsRef, isInView: pillarsInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: sequenceRef, isInView: sequenceInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="agentic-protocol" className="relative overflow-hidden py-24 md:py-32 border-y border-[var(--border-subtle)]">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* ── Header Section ── */}
        <div 
          ref={headerRef} 
          className={`max-w-3xl transition-all duration-700 ease-out ${
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1 mb-4 shadow-sm">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              How We Work
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl">
            Our Development<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">Process</span>
          </h2>
          <p className="mt-6 text-[var(--text-secondary)] md:text-lg leading-relaxed max-w-2xl">
            A clear, step-by-step approach to building your project — with your approval at every stage.
          </p>
        </div>

        {/* ── Pillars Grid ── */}
        <div
          ref={pillarsRef}
          className={`mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4 transition-all duration-1000 ease-out delay-100 ${
            pillarsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {pillars.map((pillar) => (
            <HoverCard key={pillar.id} className="flex flex-col group rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-6 transition-all duration-300 hover:border-[var(--text-tertiary)] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                  {pillar.numeral}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] group-hover:border-[var(--text-tertiary)] transition-colors">
                  <pillar.icon className="h-5 w-5 text-[var(--text-primary)]" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] flex-grow">
                {pillar.description}
              </p>

              <div className="mt-6 space-y-2 border-t border-[var(--border-subtle)] pt-4">
                {pillar.points.map((point) => (
                  <div key={point} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <ChevronRight className="h-3 w-3 text-[var(--text-tertiary)]" />
                    <span className="font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </HoverCard>
          ))}
        </div>

        {/* ── Build Sequence ── */}
        <div
          ref={sequenceRef}
          className={`mt-20 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-sm transition-all duration-1000 ease-out delay-200 ${
            sequenceInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="p-8 md:p-12 grid gap-12 lg:grid-cols-[1fr_1.2fr] items-center">
            
            {/* Left Side: Context */}
            <div>
              <div className="font-mono text-xs font-bold uppercase text-[var(--text-tertiary)] mb-4 tracking-wider">
                Our Build Sequence
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
                We build in the right order.
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
                Each phase locks in before the next begins, keeping the system
                solid and reliable. You approve each step before we move forward.
              </p>
              
              <div className="space-y-3 border-l-2 border-[var(--border-subtle)] pl-4">
                <div className="text-sm font-medium text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-bold mr-2">1.</span>
                  We stop and ask when requirements are unclear.
                </div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-bold mr-2">2.</span>
                  Clear communication removes blockers quickly.
                </div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-bold mr-2">3.</span>
                  You approve each phase before we continue.
                </div>
              </div>
            </div>

            {/* Right Side: Execution Trace */}
            <div className="space-y-3">
              {buildSequence.map((phase, idx) => (
                <div
                  key={phase.phase}
                  className="group flex items-start gap-4 rounded-md border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] p-4 transition-colors"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] group-hover:border-[var(--text-tertiary)] transition-colors">
                    <phase.icon className="h-5 w-5 text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
                      {phase.phase}
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {phase.title}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {phase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgenticProtocol;
