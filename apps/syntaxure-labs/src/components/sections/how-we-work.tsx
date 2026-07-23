import { Lightbulb, Code, Rocket } from "lucide-react";
import { Reveal } from "@/components/reveal";

const steps = [
  {
    icon: Lightbulb,
    title: "Share Your Vision",
    description:
      "Tell us about your project, goals, and budget. We'll discuss what you need and how we can help. No pressure, no obligation. Just an honest conversation about what's possible.",
    duration: "1-2 days",
  },
  {
    icon: Code,
    title: "We Build It",
    description:
      "We design and develop your custom solution using modern, reliable technology. You get regular updates and a transparent view of progress throughout the entire process.",
    duration: "2-8 weeks",
  },
  {
    icon: Rocket,
    title: "Launch & Grow",
    description:
      "We deploy your project, set up hosting, and provide ongoing support. Your system stays fast, secure, and up-to-date as your business grows. We're with you for the long haul.",
    duration: "Ongoing",
  },
];

export function HowWeWork() {
  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-500 dark:text-cyan-400">
            {"// How We Work"}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            From Idea to Launch
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-[var(--text-secondary)]">
            A simple, transparent process designed to get your project done
            right. No hidden steps, no surprises.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal
                key={step.title}
                className="relative rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8"
                threshold={0.1}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="mb-6 flex items-center gap-4">
                  {/* Step Number */}
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 font-mono text-sm font-bold text-cyan-500 dark:text-cyan-400">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="inline-flex shrink-0 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                    <Icon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {step.description}
                </p>

                {/* Duration */}
                <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                    Timeline: {step.duration}
                  </span>
                </div>

                {/* Connector line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block">
                    <div className="h-px w-8 bg-gradient-to-r from-cyan-500/40 to-transparent" />
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
