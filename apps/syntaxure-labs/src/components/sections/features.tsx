import {
  Layers,
  Shield,
  Zap,
  Bot,
  Sliders,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
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
    title: "Built for Many Users",
    description:
      "Your app can handle thousands of users at once, with separate accounts and data for each team.",
  },
  {
    id: "ready-security",
    icon: Shield,
    title: "Secure from Day One",
    description:
      "Login, passwords, and data protection are built in. No extra setup needed.",
  },
  {
    id: "template-delivery",
    icon: Zap,
    title: "Fast Delivery",
    description:
      "We use ready-made building blocks so your project launches in weeks, not months.",
  },
  {
    id: "ai-extensibility",
    icon: Bot,
    title: "Built for AI",
    description:
      "Your app is built ready for AI from day one. Add smart features, automation, and custom AI models as your business grows.",
  },
  {
    id: "productized-customization",
    icon: Sliders,
    title: "Clear Pricing",
    description:
      "Pick your plan and add features. No surprise costs.",
  },
  {
    id: "continuous-evolution",
    icon: RefreshCw,
    title: "Always Improving",
    description:
      "We keep your app updated, secure, and running smoothly as you grow.",
  },
];

export function Features() {
  return (
    <section className="relative py-16 md:py-24 lg:py-32 lazy-section border-t border-[var(--border-subtle)]" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col lg:flex-row gap-16 lg:gap-24">

        {/* ── Left Column: Section Header ── */}
        <Reveal className="lg:w-1/3">
          <div className="sticky top-32 text-center lg:text-left">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Why Choose Us
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
              Built to Last.
            </h2>
            <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
              Six core strengths built into every project we deliver. A solid foundation customized to your business without the months-long timeline.
            </p>
          </div>
        </Reveal>

        {/* ── Right Column: Features List ── */}
        <Reveal className="lg:w-2/3 grid gap-8 sm:grid-cols-2" transitionClassName="duration-1000 ease-out delay-200">
          {features.map((feature, idx) => (
            <HoverCard
              key={feature.id}
              className="rounded-md p-6 transition-all duration-300 hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-active)] flex flex-row sm:flex-col items-start gap-4 sm:gap-0"
            >
              
              {/* Icon */}
              <div className="sm:mb-4 shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-sm">
                <feature.icon
                  className="h-5 w-5 text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.5}
                />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="mt-1 sm:mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </div>
            </HoverCard>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export default Features;
