import Image from "next/image";
import Link from "next/link";
import { Check, X, Sparkles, ChevronDown } from "lucide-react";
import { getPricingPlans, getComparisonTable, getPricingFAQs } from "@/lib/pricing-db";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata = {
  title: "Pricing | Prism Context Engine",
  description:
    "Choose the right plan for your context governance needs. Start free, upgrade when you need more power.",
};

export default async function PublicPricingPage() {
  const [plans, comparisonFeatures, faqs] = await Promise.all([
    getPricingPlans(),
    getComparisonTable(),
    getPricingFAQs(),
  ]);
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <PublicNav />

      {/* Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[var(--bg-primary)] bg-[linear-gradient(to_right,var(--border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-subtle)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-full blur-3xl -z-10" />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
              Simple, Transparent
            </span>{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more power. No hidden fees, no
            surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-lg border p-6 ${
                plan.popular
                  ? "border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent"
                  : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium text-[var(--bg-primary)]">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                {plan.price.monthly === null ? (
                  <div className="text-3xl font-bold text-[var(--text-primary)]">Custom</div>
                ) : plan.price.monthly === 0 ? (
                  <div className="text-3xl font-bold text-[var(--text-primary)]">Free</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      ${plan.price.monthly}
                    </span>
                    <span className="text-[var(--text-secondary)]">/month</span>
                  </div>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full rounded-md py-2.5 font-medium text-center transition-all ${
                  plan.popular
                    ? "bg-cyan-500 text-[var(--bg-primary)] hover:bg-cyan-400"
                    : plan.price.monthly === 0
                    ? "border border-[var(--border-active)] text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5"
                    : plan.price.monthly === null
                    ? "border border-[var(--border-active)] text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5"
                    : "bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Plan Comparison Table */}
      <section className="px-4 py-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-8">
            Compare Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-4 px-4 text-[var(--text-secondary)] font-medium">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-[var(--text-primary)] font-medium">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 text-cyan-400 font-medium">
                    Pro
                  </th>
                  <th className="text-center py-4 px-4 text-[var(--text-primary)] font-medium">
                    Team
                  </th>
                  <th className="text-center py-4 px-4 text-[var(--text-primary)] font-medium">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b border-[var(--border-subtle)]">
                    <td className="py-4 px-4 text-[var(--text-secondary)] text-sm">
                      {feature.name}
                    </td>
                    {(["free", "pro", "team", "enterprise"] as const).map(
                      (plan) => {
                        const value = feature[plan];
                        return (
                          <td key={plan} className="py-4 px-4 text-center">
                            {typeof value === "boolean" ? (
                              value ? (
                                <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-[var(--text-secondary)] opacity-50 mx-auto" />
                              )
                            ) : (
                              <span className="text-[var(--text-secondary)] text-sm font-mono">
                                {value}
                              </span>
                            )}
                          </td>
                        );
                      },
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden"
              >
                <summary className="cursor-pointer p-4 flex items-center justify-between font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 text-[var(--text-secondary)] transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-[var(--text-secondary)] text-sm">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Ready to eliminate context pollution?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Start with Free, upgrade when you need more. No credit card
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-8 py-4 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                Start Free →
              </span>
            </Link>
            <Link
              href="https://www.syntaxure.dev/contact"
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-8 py-4 transition-all hover:bg-[var(--text-primary)]/5 hover:border-[var(--border-active)] active:scale-95"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-secondary)]">
                Talk to Sales
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/prism-icon.png"
                  alt="Prism Context Engine"
                  width={24}
                  height={24}
                />
                <span className="text-gradient-cyan font-bold">
                  Prism Context Engine
                </span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">
                The Context Operating System for developers who ship fast.
              </p>
            </div>

            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 text-sm uppercase tracking-wider">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-[var(--text-secondary)] hover:text-cyan-400 text-sm transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-[var(--text-secondary)] hover:text-cyan-400 text-sm transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://docs.syntaxure.dev"
                    target="_blank"
                    className="text-[var(--text-secondary)] hover:text-cyan-400 text-sm transition-colors"
                  >
                    Docs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 text-sm uppercase tracking-wider">
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="https://www.syntaxure.dev"
                    target="_blank"
                    className="text-[var(--text-secondary)] hover:text-cyan-400 text-sm transition-colors"
                  >
                    About Syntaxure Labs
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.syntaxure.dev/contact"
                    target="_blank"
                    className="text-[var(--text-secondary)] hover:text-cyan-400 text-sm transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 text-sm uppercase tracking-wider">
                Get Started
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Ready to eliminate context pollution?
              </p>
              <Link
                href="/sign-up"
                className="inline-block glass px-6 py-2 rounded-md hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider text-[var(--text-primary)]"
              >
                Start Free →
              </Link>
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[var(--text-secondary)] opacity-70 text-xs font-mono">
              © {new Date().getFullYear()} Syntaxure Labs. Built with Prism
              Context Engine.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link
                href="/terms"
                className="text-[var(--text-secondary)] opacity-70 hover:text-[var(--text-secondary)] text-xs transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-[var(--text-secondary)] opacity-70 hover:text-[var(--text-secondary)] text-xs transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
