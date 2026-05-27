"use client";

import { useRef, useEffect } from "react";
import {
  Bot,
  PiggyBank,
  Shield,
  MessageSquare,
  Zap,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Feature = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  detailed?: string;
};

const features: Feature[] = [
  {
    id: "ai-native",
    icon: Bot,
    title: "AI-Native Development",
    description:
      "IDE-native agents execute with precision, context awareness, and autonomous problem-solving capability.",
    detailed:
      "Our development pipeline integrates AI agents directly into the IDE, giving them full workspace context to map dependencies, trace issues, and execute tasks end-to-end without human micromanagement.",
  },
  {
    id: "fixed-pricing",
    icon: PiggyBank,
    title: "Fixed Investment Pricing",
    description:
      "Clear scope, milestone-based delivery, and fixed quotes — no surprise invoices or scope creep.",
    detailed:
      "Every project follows a structured Statement of Work with defined milestones, deliverables, and fixed pricing. You know exactly what you pay and when — zero billing anxiety.",
  },
  {
    id: "enterprise-security",
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "Firebase Auth, session-based RBAC, encrypted data at rest — built for compliance from day one.",
    detailed:
      "We implement defense-in-depth with Firebase Authentication, custom session management, role-based access controls, encrypted Firestore collections, and comprehensive audit logging for SOC 2 readiness.",
  },
  {
    id: "socratic-planning",
    icon: MessageSquare,
    title: "Socratic Planning",
    description:
      "Zero assumptions. We ask targeted questions before writing a single line of code.",
    detailed:
      "Our Clarification-First Doctrine means every project starts with a structured Q&A loop. We challenge assumptions, map edge cases, and validate requirements before any engineering begins — saving weeks of rework.",
  },
  {
    id: "rapid-mvp",
    icon: Zap,
    title: "Rapid MVP Delivery",
    description:
      "From concept to working prototype in weeks, not months — validated, tested, and production-ready.",
    detailed:
      "Using our proprietary build sequences and pre-built architecture templates, we compress typical 3-month timelines into 2-3 weeks for functional, polished MVP launches.",
  },
  {
    id: "post-launch",
    icon: HeartHandshake,
    title: "Post-Launch Partnership",
    description:
      "Ongoing maintenance, feature evolution, and performance monitoring — we grow with you.",
    detailed:
      "Every project includes a transition period and optional retainer packages covering bug fixes, performance optimization, feature iterations, and architecture evolution as your product scales.",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(
        [headerRef.current, cardsRef.current?.children || []],
        { opacity: 1, y: 0, scale: 1, clearProps: "all" },
      );
      return;
    }

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
            start: "top 85%",
          },
        },
      );

      gsap.fromTo(
        cardsRef.current?.children || [],
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 lazy-section" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-purple-400">
            {"// Why Choose Us"}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Built Different.{" "}
            <span className="text-gradient-holographic">
              Engineered Better.
            </span>
          </h2>
          <p className="mt-4 text-white/50">
            Six pillars that define how we build — from AI-native workflows to
            post-launch partnerships. No shortcuts, no compromises.
          </p>
        </div>

        {/* Features Grid */}
        <div
          ref={cardsRef}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative overflow-hidden glass-neon glass-shimmer rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 group-hover:shadow-glow-cyan">
                <feature.icon
                  className="h-6 w-6 text-white/60 transition-all duration-300 group-hover:text-cyan-400 group-hover:scale-110"
                  strokeWidth={1.5}
                />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white group-hover:text-cyan-50 transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50 group-hover:text-white/65 transition-colors">
                {feature.description}
              </p>

              {/* Neon indicator dot — subtle glow accent */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400/60">
                  {feature.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
