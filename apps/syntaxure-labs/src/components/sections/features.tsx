"use client";

import {
  Bot,
  PiggyBank,
  Shield,
  MessageSquare,
  Zap,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { HoverCard } from "@syntaxure/ui";

type Feature = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    id: "ai-native",
    icon: Bot,
    title: "AI-Native Development",
    description:
      "IDE-native agents execute with precision, giving them full workspace context to map dependencies and solve problems.",
  },
  {
    id: "fixed-pricing",
    icon: PiggyBank,
    title: "Fixed Investment Pricing",
    description:
      "Clear scope, milestone-based delivery, and fixed quotes — no surprise invoices or scope creep.",
  },
  {
    id: "enterprise-security",
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "Firebase Auth, session-based RBAC, encrypted data at rest — built for compliance from day one.",
  },
  {
    id: "socratic-planning",
    icon: MessageSquare,
    title: "Socratic Planning",
    description:
      "Zero assumptions. We ask targeted questions before writing a single line of code, saving weeks of rework.",
  },
  {
    id: "rapid-mvp",
    icon: Zap,
    title: "Rapid MVP Delivery",
    description:
      "Using our proprietary build sequences, we compress typical 3-month timelines into 2-3 weeks for validated launches.",
  },
  {
    id: "post-launch",
    icon: HeartHandshake,
    title: "Post-Launch Partnership",
    description:
      "Ongoing maintenance, feature evolution, and performance monitoring — we grow with you as your product scales.",
  },
];

export function Features() {
  const { ref: headerRef, isInView: headerInView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const { ref: listRef, isInView: listInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="relative py-24 lg:py-32 lazy-section border-t border-[var(--border-subtle)]" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* ── Left Column: Section Header ── */}
        <div
          ref={headerRef}
          className={`lg:w-1/3 transition-all duration-700 ease-out ${
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="sticky top-32">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Infrastructure
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
              Engineered Better.
            </h2>
            <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
              Six pillars that define how we build — from AI-native workflows to
              post-launch partnerships. No shortcuts, no compromises. We build robust systems meant to scale.
            </p>
          </div>
        </div>

        {/* ── Right Column: Features List ── */}
        <div
          ref={listRef}
          className={`lg:w-2/3 grid gap-8 sm:grid-cols-2 transition-all duration-1000 ease-out delay-200 ${
            listInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {features.map((feature, idx) => (
            <HoverCard
              key={feature.id}
              className="rounded-md p-6 transition-all duration-300 hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-active)]"
            >
              
              {/* Icon */}
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-sm">
                <feature.icon
                  className="h-5 w-5 text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.5}
                />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
