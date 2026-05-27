"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import {
  Database,
  Shield,
  Code,
  Palette,
  Sparkles,
  type LucideIcon,
  ChevronRight,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// --- Data Models ---
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
  accent: string;
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
      "Zero-assumption execution requires a Socratic Q and A loop before building.",
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
    accent: "text-cyan-400",
  },
  {
    phase: "Phase 2",
    title: "Security Layer",
    description: "Auth, sessions, and RBAC before any public endpoints.",
    icon: Shield,
    accent: "text-emerald-400",
  },
  {
    phase: "Phase 3",
    title: "Logic and API",
    description: "Server logic, routes, and data mutations with validation.",
    icon: Code,
    accent: "text-purple-400",
  },
  {
    phase: "Phase 4",
    title: "Interface Layer",
    description: "UI binds to state once the core system is proven.",
    icon: Palette,
    accent: "text-white/70",
  },
];

// --- Subcomponents ---

function SpotlightCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/30 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(6, 182, 212, 0.12), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

// --- Main Section ---

export function AgenticProtocol() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(
        [
          headerRef.current,
          pillarsRef.current?.children || [],
          sequenceRef.current,
        ],
        { opacity: 1, y: 0, scale: 1, rotationX: 0, clearProps: "all" },
      );
      return;
    }

    const ctx = gsap.context(() => {
      // 3D Scale/Fade for header
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
          },
        },
      );

      // Staggered 3D reveal for pillars
      gsap.fromTo(
        pillarsRef.current?.children || [],
        { opacity: 0, y: 50, scale: 0.95, rotationX: -10 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: pillarsRef.current,
            start: "top 80%",
          },
        },
      );

      // Slide up and fade for sequence terminal
      gsap.fromTo(
        sequenceRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sequenceRef.current,
            start: "top 85%",
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="agentic-protocol"
      className="relative overflow-hidden py-24 md:py-32 bg-void lazy-section"
      style={{ perspective: "1000px" }}
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute -right-24 bottom-20 h-96 w-96 rounded-full bg-purple-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header Section */}
        <div ref={headerRef} className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 mb-4 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
              Agentic.Protocol // Manifesto
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            The Syntaxure Labs <br />
            <span className="text-gradient-holographic">Agentic Protocol</span>
          </h2>
          <p className="mt-6 text-white/60 md:text-lg leading-relaxed">
            A manifesto for autonomous, AI-native engineering. Built for
            IDE-native agents that execute with precision, clarity, and
            uncompromising human oversight.
          </p>
        </div>

        {/* Pillars Grid */}
        <div
          ref={pillarsRef}
          className="mt-16 grid gap-6 md:grid-cols-2"
          style={{ transformStyle: "preserve-3d" }}
        >
          {pillars.map((pillar) => (
            <SpotlightCard key={pillar.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/30 group-hover:text-cyan-400/50 transition-colors">
                  {pillar.numeral}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/40 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all duration-300">
                  <pillar.icon className="h-5 w-5 text-white/50 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>

              <h3 className="mt-6 text-xl font-semibold text-white group-hover:text-cyan-50 transition-colors">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50 group-hover:text-white/70 transition-colors flex-grow">
                {pillar.description}
              </p>

              <div className="mt-6 space-y-2.5 border-t border-white/5 pt-4">
                {pillar.points.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 text-xs text-white/40 group-hover:text-white/60 transition-colors"
                  >
                    <ChevronRight className="h-3 w-3 text-cyan-500/50" />
                    <span className="font-mono">{point}</span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          ))}
        </div>

        {/* Terminal Section (Build Sequence) */}
        <div
          ref={sequenceRef}
          className="mt-24 overflow-hidden rounded-xl border border-white/[0.08] agentic-terminal"
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-black/60 px-4 py-3 backdrop-blur-md">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80 border border-red-600" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80 border border-yellow-600" />
              <div className="h-3 w-3 rounded-full bg-green-500/80 border border-green-600" />
            </div>
            <div className="font-mono text-[10px] uppercase text-white/40 tracking-wider">
              bash - ./agent_build_sequence.sh
            </div>
            <div className="w-10" />{" "}
            {/* Spacer to perfectly center the title */}
          </div>

          {/* Terminal Body */}
          <div className="p-6 md:p-10">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
              {/* Left Side: Terminal Output Vibe */}
              <div className="font-mono">
                <div className="flex items-center gap-2 text-cyan-400 text-sm mb-6">
                  <span className="text-purple-400">➜</span>
                  <span className="text-emerald-400">~</span>
                  <span>./execute --protocol=hierarchy</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 font-sans tracking-tight">
                  Hierarchical Build Sequence
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mb-8">
                  <span className="text-purple-400/70">
                    # Form follows foundation.
                  </span>
                  <br />
                  Each phase locks in before the next begins, keeping the system
                  coherent and technical debt-free.
                </p>

                {/* Secondary Logs */}
                <div className="space-y-4 text-xs text-white/40 border-l border-white/10 pl-4 ml-2">
                  <div className="hover:text-white/60 transition-colors">
                    <span className="text-cyan-500 mr-2">[WARN]</span>
                    Agents halt on ambiguity. Socratic Q&A required.
                  </div>
                  <div className="hover:text-white/60 transition-colors">
                    <span className="text-emerald-500 mr-2">[INFO]</span>
                    Human-in-the-loop (HITL) gates enabled for every commit.
                  </div>
                </div>
              </div>

              {/* Right Side: Execution Trace */}
              <div className="space-y-4">
                {buildSequence.map((phase, idx) => (
                  <div
                    key={phase.phase}
                    className="group flex items-stretch gap-4 rounded-lg border border-white/[0.04] bg-white/[0.01] p-4 transition-all hover:bg-white/[0.03] hover:border-white/10"
                  >
                    <div className="flex flex-col items-center justify-start pt-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/50 transition-colors group-hover:border-${phase.accent.replace("text-", "")}/30`}
                      >
                        <phase.icon
                          className={`h-4 w-4 ${phase.accent} opacity-70 group-hover:opacity-100 transition-opacity`}
                        />
                      </div>
                      {idx !== buildSequence.length - 1 && (
                        <div className="w-[1px] flex-grow bg-gradient-to-b from-white/10 to-transparent my-2" />
                      )}
                    </div>

                    <div className="pb-2">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-1 group-hover:text-white/50 transition-colors">
                        {phase.phase}
                      </div>
                      <h4 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                        {phase.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/50 group-hover:text-white/70 transition-colors font-mono">
                        <span className="text-purple-500/50 mr-2">&gt;</span>
                        {phase.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgenticProtocol;
