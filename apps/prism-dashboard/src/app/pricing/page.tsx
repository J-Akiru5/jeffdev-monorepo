import Image from 'next/image';
import Link from 'next/link';
import { Check, X, Sparkles, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'Pricing | Prism Context Engine',
  description: 'Choose the right plan for your context governance needs. Start free, upgrade when you need more power.',
};

const plans = [
  {
    name: 'Free',
    tagline: 'Get started with the basics',
    price: { monthly: 0, annual: 0 },
    features: [
      '5 rules',
      '3 components',
      '1 project',
      '10 AI generations/month',
      'Export as Markdown',
    ],
    cta: 'Get Started',
    href: '/sign-up',
  },
  {
    name: 'Pro',
    tagline: 'For serious developers',
    price: { monthly: 990, annual: 9900 },
    features: [
      'Unlimited rules',
      'Unlimited components',
      '10 projects',
      '500 AI generations/month',
      'IDE auto-sync',
      'All design systems',
      'All stack templates',
      'Priority support',
    ],
    popular: true,
    cta: 'Start Free Trial',
    href: '/sign-up',
  },
  {
    name: 'Team',
    tagline: 'Collaborate with your team',
    price: { monthly: 2990, annual: 29900 },
    features: [
      'Everything in Pro',
      'Unlimited projects',
      '2,000 AI generations/month',
      'Up to 10 team members',
      'Shared component library',
      'Team rule management',
      'Admin dashboard',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up',
  },
  {
    name: 'Enterprise',
    tagline: 'Custom solutions for scale',
    price: null,
    features: [
      'Everything in Team',
      'Unlimited team members',
      'Unlimited AI generations',
      'SSO/SAML',
      'Audit logs',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    href: 'https://jeffdev.studio/contact',
  },
];

const comparisonFeatures = [
  { name: 'Rules', free: '5', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Components', free: '3', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Projects', free: '1', pro: '10', team: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'AI Generations/mo', free: '10', pro: '500', team: '2,000', enterprise: 'Unlimited' },
  { name: 'IDE Auto-sync', free: false, pro: true, team: true, enterprise: true },
  { name: 'Team Members', free: '-', pro: '-', team: '10', enterprise: 'Unlimited' },
  { name: 'Shared Library', free: false, pro: false, team: true, enterprise: true },
  { name: 'SSO/SAML', free: false, pro: false, team: false, enterprise: true },
  { name: 'Audit Logs', free: false, pro: false, team: false, enterprise: true },
  { name: 'Priority Support', free: false, pro: true, team: true, enterprise: true },
  { name: 'Dedicated Support', free: false, pro: false, team: false, enterprise: true },
];

const faqs = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes! You can cancel your subscription at any time. You\'ll retain access until the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept PayPal, which supports credit cards, debit cards, and PayPal balance.',
  },
  {
    question: 'Can I upgrade or downgrade later?',
    answer: 'Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your rules and components remain accessible in read-only mode for 30 days. You can always export them or resubscribe to regain full access.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day money-back guarantee for annual subscriptions. Monthly subscriptions can be cancelled anytime but are non-refundable for the current period.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Pro and Team plans include a 7-day free trial. No credit card required to start.',
  },
];

import { PublicNav } from '@/components/layout/public-nav';

export default function PublicPricingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <PublicNav />

      {/* Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[#050505] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-full blur-3xl -z-10" />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Simple, Transparent
            </span>{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more power. No hidden fees, no surprises.
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
                  ? 'border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent'
                : 'border-white/10 bg-white/2'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium text-black">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/60">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                {plan.price === null ? (
                  <div className="text-3xl font-bold text-white">Custom</div>
                ) : plan.price.monthly === 0 ? (
                  <div className="text-3xl font-bold text-white">Free</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      ₱{plan.price.monthly.toLocaleString()}
                    </span>
                    <span className="text-white/60">/month</span>
                  </div>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full rounded-md py-2.5 font-medium text-center transition-all ${
                  plan.popular
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                    : plan.price?.monthly === 0
                    ? 'border border-white/20 text-white hover:bg-white/5'
                    : plan.price === null
                    ? 'border border-white/20 text-white hover:bg-white/5'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Plan Comparison Table */}
      <section className="px-4 py-16 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Compare Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/60 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-white font-medium">Free</th>
                  <th className="text-center py-4 px-4 text-cyan-400 font-medium">Pro</th>
                  <th className="text-center py-4 px-4 text-white font-medium">Team</th>
                  <th className="text-center py-4 px-4 text-white font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b border-white/5">
                    <td className="py-4 px-4 text-white/80 text-sm">{feature.name}</td>
                    {(['free', 'pro', 'team', 'enterprise'] as const).map((plan) => {
                      const value = feature[plan];
                      return (
                        <td key={plan} className="py-4 px-4 text-center">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-white/20 mx-auto" />
                            )
                          ) : (
                            <span className="text-white/80 text-sm font-mono">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-lg border border-white/10 bg-white/2 overflow-hidden"
              >
                <summary className="cursor-pointer p-4 flex items-center justify-between font-medium text-white hover:bg-white/2 transition-colors">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 text-white/40 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-white/60 text-sm">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to eliminate context pollution?
          </h2>
          <p className="text-white/60 mb-8">
            Start with Free, upgrade when you need more. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-8 py-4 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-white font-semibold">
                Start Free →
              </span>
            </Link>
            <Link
              href="https://jeffdev.studio/contact"
              className="rounded-md border border-white/10 bg-white/2 px-8 py-4 transition-all hover:bg-white/5 hover:border-white/20 active:scale-95"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-white/80">
                Talk to Sales
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto">
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
                <span className="text-gradient-cyan font-bold">Prism Context Engine</span>
              </div>
              <p className="text-white/40 text-sm">
                The Context Operating System for developers who ship fast.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="https://docs.jeffdev.studio" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Docs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="https://jeffdev.studio" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    About JD Studio
                  </Link>
                </li>
                <li>
                  <Link href="https://jeffdev.studio/contact" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Get Started</h3>
              <p className="text-white/60 text-sm mb-4">
                Ready to eliminate context pollution?
              </p>
              <Link
                href="/sign-up"
                className="inline-block glass px-6 py-2 rounded-md hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider text-white"
              >
                Start Free →
              </Link>
            </div>
          </div>

          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/30 text-xs font-mono">
              © {new Date().getFullYear()} JD Studio. Built with Prism Context Engine.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/terms" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
