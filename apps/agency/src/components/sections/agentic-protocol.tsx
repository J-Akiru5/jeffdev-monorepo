'use client';

import { useEffect, useRef } from 'react';
import { Database, Shield, Code, Palette, Sparkles, type LucideIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
    id: 'autonomy',
    numeral: 'I',
    title: 'Autonomous Solver Paradigm',
    description:
      'Agents map the full workspace, trace dependencies, and execute tasks end to end.',
    points: ['Contextual autonomy', 'Execution over suggestion', 'Agnostic integration'],
    icon: Sparkles,
  },
  {
    id: 'clarification',
    numeral: 'II',
    title: 'Clarification-First Doctrine',
    description:
      'Zero-assumption execution requires a Socratic Q and A loop before building.',
    points: ['Stop on ambiguity', 'Ask targeted questions', 'Measure twice, code once'],
    icon: Shield,
  },
  {
    id: 'sequence',
    numeral: 'III',
    title: 'Hierarchical Build Sequence',
    description:
      'Form follows foundation with data, security, logic, then interface.',
    points: ['Schema defines truth', 'Security gates access', 'UI reflects validated logic'],
    icon: Database,
  },
  {
    id: 'hitl',
    numeral: 'IV',
    title: 'Continuous Review and HITL',
    description:
      'Human review gates each phase and keeps every decision traceable.',
    points: ['Stage-gated commits', 'Traceable logic notes', 'Human approval to proceed'],
    icon: Code,
  },
];

const buildSequence: BuildPhase[] = [
  {
    phase: 'Phase 1',
    title: 'Data Layer',
    description: 'Define entities, relationships, constraints, and indexing.',
    icon: Database,
    accent: 'text-cyan-400',
  },
  {
    phase: 'Phase 2',
    title: 'Security Layer',
    description: 'Auth, sessions, and RBAC before any public endpoints.',
    icon: Shield,
    accent: 'text-emerald-400',
  },
  {
    phase: 'Phase 3',
    title: 'Logic and API',
    description: 'Server logic, routes, and data mutations with validation.',
    icon: Code,
    accent: 'text-purple-400',
  },
  {
    phase: 'Phase 4',
    title: 'Interface Layer',
    description: 'UI binds to state once the core system is proven.',
    icon: Palette,
    accent: 'text-white/70',
  },
];

/**
 * Agentic Protocol Section
 * ------------------------
 * Dedicated manifesto block for the Syntaxure Labs Agentic Protocol.
 */
export function AgenticProtocol() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
          },
        }
      );

      gsap.fromTo(
        pillarsRef.current?.children || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.12,
          scrollTrigger: {
            trigger: pillarsRef.current,
            start: 'top 80%',
          },
        }
      );

      gsap.fromTo(
        sequenceRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: sequenceRef.current,
            start: 'top 85%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="agentic-protocol"
      className="relative overflow-hidden py-24 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={headerRef} className="max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
            {'// Agentic.Protocol'}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            The Syntaxure Labs Agentic Protocol
          </h2>
          <p className="mt-4 text-white/60 md:text-lg">
            A manifesto for autonomous, AI-native engineering. Built for
            IDE-native agents that execute with precision, clarity, and human
            oversight.
          </p>
        </div>

        <div
          ref={pillarsRef}
          className="mt-12 grid gap-6 md:grid-cols-2"
        >
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="group relative overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">
                  {pillar.numeral}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5">
                  <pillar.icon className="h-5 w-5 text-cyan-400" />
                </div>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {pillar.description}
              </p>

              <div className="mt-4 space-y-2">
                {pillar.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400/70" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        <div
          ref={sequenceRef}
          className="mt-16 rounded-md border border-white/[0.08] bg-white/[0.02] p-8 md:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1.6fr]">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-white/40">
                {'// Build.Sequence'}
              </span>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Hierarchical Build Sequence
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Form follows foundation. Each phase locks in before the next
                begins, keeping the system coherent and debt-free.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {buildSequence.map((phase) => (
                <div
                  key={phase.phase}
                  className="flex items-start gap-4 rounded-md border border-white/[0.06] bg-black/40 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5">
                    <phase.icon className={`h-5 w-5 ${phase.accent}`} />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                      {phase.phase}
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-white">
                      {phase.title}
                    </h4>
                    <p className="mt-1 text-xs text-white/50">
                      {phase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-white/[0.08] pt-8 md:grid-cols-2">
            <div className="rounded-md border border-white/[0.06] bg-black/40 p-5">
              <div className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                Clarification First
              </div>
              <p className="mt-3 text-sm text-white/60">
                Agents halt on ambiguity, ask the smallest useful questions, and
                only then generate the solution.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Zero assumption', 'Socratic Q and A', 'Measure twice'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-white/[0.06] bg-black/40 p-5">
              <div className="font-mono text-xs uppercase tracking-wider text-purple-400">
                Human in the Loop
              </div>
              <p className="mt-3 text-sm text-white/60">
                Every phase ends with a review gate, backed by traceable logic
                and explicit approval to proceed.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Stage-gated commits', 'Traceable decisions', 'Risk reduced'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60"
                  >
                    {tag}
                  </span>
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
