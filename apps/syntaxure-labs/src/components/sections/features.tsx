"use client";

import {
  Layers,
  Shield,
  Zap,
  Bot,
  Sliders,
  RefreshCw,
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
    id: "multi-tenant",
    icon: Layers,
    title: "Multi-Tenant Architecture",
    description:
      "Built for Scale. Every template features a fully-baked multi-tenant architecture with robust organization isolation, team workspaces, and scalable database indexing right out of the box.",
  },
  {
    id: "ready-security",
    icon: Shield,
    title: "Ready-to-Ship Security",
    description:
      "Turnkey Compliance. Production-grade authentication, role-based access control (RBAC), and encrypted data handling are natively integrated into the core boilerplate.",
  },
  {
    id: "template-delivery",
    icon: Zap,
    title: "Template-Accelerated Delivery",
    description:
      "Zero to Launch in Weeks. Because we skip the repetitive boilerplate phase and start directly with a production-ready SaaS template, your custom deployment takes weeks, not months.",
  },
  {
    id: "ai-extensibility",
    icon: Bot,
    title: "AI-Native Extensibility",
    description:
      "AI-Ready Foundations. Our core architecture is built to cleanly integrate AI native workflows, vector search, and automated pipeline contexts, making it simple to inject intelligence into your custom features.",
  },
  {
    id: "productized-customization",
    icon: Sliders,
    title: "Productized Customization",
    description:
      "Predictable Value Tiers. No ambiguous agency estimates. Choose your base SaaS template and pick exactly the custom modules and integrations you need with transparent, predictable pricing.",
  },
  {
    id: "continuous-evolution",
    icon: RefreshCw,
    title: "Continuous Evolution",
    description:
      "CI/CD Enabled Growth. Our decoupled template infrastructure allows us to seamlessly deploy feature upgrades, maintain dependency security, and scale your application as your user base expands.",
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
              Our Production Core. Six architectural pillars engineered into our base SaaS templates, giving you a production-ready foundation that we customize to your exact business logic without the custom-build timeline.
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
