import { PricingGrid } from '@/components/subscription';

export const metadata = {
  title: 'Pricing | Prism Context Engine',
  description: 'Choose your Prism Context Engine subscription plan',
};

export default function PricingPage() {
  // TODO: Fetch current subscription from database
  const currentTier = 'free' as const;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Choose Your Plan
        </h1>
        <p className="mt-2 text-white/60">
          Start free, upgrade when you need more power.
        </p>
      </div>

      <PricingGrid currentTier={currentTier} />

      {/* FAQ Section */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          <details className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer font-medium text-white">
              Can I cancel anytime?
            </summary>
            <p className="mt-2 text-white/60 text-sm">
              Yes! You can cancel your subscription at any time. You&apos;ll retain access until the end of your billing period.
            </p>
          </details>

          <details className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer font-medium text-white">
              What payment methods do you accept?
            </summary>
            <p className="mt-2 text-white/60 text-sm">
              We accept PayPal, which supports credit cards, debit cards, and PayPal balance.
            </p>
          </details>

          <details className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer font-medium text-white">
              Can I upgrade or downgrade later?
            </summary>
            <p className="mt-2 text-white/60 text-sm">
              Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.
            </p>
          </details>

          <details className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer font-medium text-white">
              What happens to my data if I cancel?
            </summary>
            <p className="mt-2 text-white/60 text-sm">
              Your rules and components remain accessible in read-only mode. You can always export them or resubscribe to regain full access.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
