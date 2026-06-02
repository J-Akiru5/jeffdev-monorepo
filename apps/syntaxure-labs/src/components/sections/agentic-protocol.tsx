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
    title: "Autonomous Solver Paradigm",
    description:
      "Agents map the full workspace, trace dependencies, and execute tasks end to end.",
    points: [
      "Contextual autonomy",
      "Execution over suggestion",
      "Agnostic integration",
    ],
    icon: Sparkles,
  },
  {
    id: "clarification",
    numeral: "II",
    title: "Clarification-First Doctrine",
    description:
      "Zero-assumption execution requires a Socratic Q & A loop before building.",
    points: [
      "Stop on ambiguity",
      "Ask targeted questions",
      "Measure twice, code once",
    ],
    icon: Shield,
  },
  {
    id: "sequence",
    numeral: "III",
    title: "Hierarchical Build Sequence",
    description:
      "Form follows foundation with data, security, logic, then interface.",
    points: [
      "Schema defines truth",
      "Security gates access",
      "UI reflects validated logic",
    ],
    icon: Database,
  },
  {
    id: "hitl",
    numeral: "IV",
    title: "Continuous Review and HITL",
    description:
      "Human review gates each phase and keeps every decision traceable.",
    points: [
      "Stage-gated commits",
      "Traceable logic notes",
      "Human approval to proceed",
    ],
    icon: Code,
  },
];

const buildSequence: BuildPhase[] = [
  {
    phase: "Phase 1",
    title: "Data Layer",
    description: "Define entities, relationships, constraints, and indexing.",
    icon: Database,
  },
  {
    phase: "Phase 2",
    title: "Security Layer",
    description: "Auth, sessions, and RBAC before any public endpoints.",
    icon: Shield,
  },
  {
    phase: "Phase 3",
    title: "Logic and API",
    description: "Server logic, routes, and data mutations with validation.",
    icon: Code,
  },
  {
    phase: "Phase 4",
    title: "Interface Layer",
    description: "UI binds to state once the core system is proven.",
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
              Agentic.Protocol // Manifesto
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl">
            The Syntaxure Labs <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">Agentic Protocol</span>
          </h2>
          <p className="mt-6 text-[var(--text-secondary)] md:text-lg leading-relaxed max-w-2xl">
            A manifesto for autonomous, AI-native engineering. Built for
            IDE-native agents that execute with precision, clarity, and
            uncompromising human oversight.
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
                Hierarchical Build Sequence
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
                Form follows foundation.
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
                Each phase locks in before the next begins, keeping the system
                coherent and technical debt-free. We enforce this sequence via our custom IDE protocols.
              </p>
              
              <div className="space-y-3 border-l-2 border-[var(--border-subtle)] pl-4">
                <div className="text-sm font-medium text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-bold mr-2">1.</span>
                  Agents halt on ambiguity.
                </div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-bold mr-2">2.</span>
                  Socratic Q&A resolves blockers.
                </div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-bold mr-2">3.</span>
                  HITL gates enabled for commits.
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
