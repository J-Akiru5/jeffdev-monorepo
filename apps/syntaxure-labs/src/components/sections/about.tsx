/**
 * About Section
 * --------------
 * Company story, values, and founder info.
 */

import { Target, Zap, Shield, Users } from "lucide-react";
import { Reveal } from "@/components/reveal";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description:
      "We build products that solve real problems for real businesses, not just technical exercises.",
  },
  {
    icon: Zap,
    title: "Performance First",
    description:
      "Every system we build is optimized for speed, reliability, and scale from day one.",
  },
  {
    icon: Shield,
    title: "Security by Default",
    description:
      "Enterprise-grade security practices baked into every project, not bolted on after.",
  },
  {
    icon: Users,
    title: "Partnership Mindset",
    description:
      "We treat every client as a partner, invested in their success beyond just delivery.",
  },
];

export function About() {
  return (
    <section className="relative py-16 md:py-24 lg:py-32" id="about">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <Reveal className="mx-auto max-w-2xl text-center" threshold={0.2}>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            About Us
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            Building the Future, One System at a Time
          </h2>
        </Reveal>

        {/* Content */}
        <Reveal className="mt-12 grid gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1 space-y-6">
            <p className="text-lg text-[var(--text-secondary)]">
              Syntaxure Labs is a boutique software studio specializing in high-performance web systems
              for ambitious startups and enterprises. We combine deep technical expertise with a
              product-minded approach to deliver systems that scale.
            </p>
            <p className="text-[var(--text-secondary)]">
              Founded on the principle that great software is built through partnership, not
              hand-offs, we work closely with our clients to understand their business, their users,
              and their goals. Every line of code we write is in service of their success.
            </p>
            <p className="text-[var(--text-secondary)]">
              Our stack is modern, our standards are high, and our commitment is unwavering. From
              SaaS platforms to AI-powered tools, we build systems that businesses depend on.
            </p>
          </div>

          <div className="order-1 lg:order-2 flex items-center justify-center">
            <div className="relative h-64 w-64 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-cyan-500/20">S</div>
                  <div className="mt-2 text-sm text-[var(--text-tertiary)]">Syntaxure Labs</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Values */}
        <Reveal className="mt-20" threshold={0.1}>
          <h3 className="mb-8 text-center text-xl font-semibold text-[var(--text-primary)]">
            Our Values
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 sm:p-6 flex flex-row sm:flex-col items-start gap-4 sm:gap-0"
                >
                  <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 sm:mb-4">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      {value.title}
                    </h4>
                    <p className="mt-1 sm:mt-2 text-base text-[var(--text-secondary)]">
                      {value.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
