"use client";

/**
 * Pricing Card Component
 *
 * Displays a subscription tier with features and pricing
 */

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { TIER_PRICES, type SubscriptionTier } from "@/lib/subscriptions";

interface PricingCardProps {
  tier: SubscriptionTier;
  currentTier?: SubscriptionTier;
  onSubscribe: (
    tier: SubscriptionTier,
    billing: "monthly" | "annual",
  ) => Promise<void>;
}

const TIER_INFO: Record<
  SubscriptionTier,
  {
    name: string;
    tagline: string;
    features: string[];
    popular?: boolean;
  }
> = {
  free: {
    name: "Free",
    tagline: "Get started with the basics",
    features: [
      "5 rules",
      "3 components",
      "1 project",
      "10 AI generations/month",
      "Export as Markdown",
    ],
  },
  pro: {
    name: "Pro",
    tagline: "For serious developers",
    features: [
      "Unlimited rules",
      "Unlimited components",
      "10 projects",
      "500 AI generations/month",
      "IDE auto-sync",
      "All design systems",
      "All stack templates",
      "Priority support",
    ],
    popular: true,
  },
  team: {
    name: "Team",
    tagline: "Collaborate with your team",
    features: [
      "Everything in Pro",
      "Unlimited projects",
      "2,000 AI generations/month",
      "Up to 10 team members",
      "Shared component library",
      "Team rule management",
      "Admin dashboard",
    ],
  },
  enterprise: {
    name: "Enterprise",
    tagline: "Custom solutions for scale",
    features: [
      "Everything in Team",
      "Unlimited team members",
      "Unlimited AI generations",
      "SSO/SAML",
      "Audit logs",
      "Dedicated support",
      "Custom integrations",
    ],
  },
};

export function PricingCard({
  tier,
  currentTier,
  onSubscribe,
}: PricingCardProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const info = TIER_INFO[tier];
  const prices =
    tier !== "free" && tier !== "enterprise" ? TIER_PRICES[tier] : null;
  const isCurrentTier = currentTier === tier;
  const isFree = tier === "free";
  const isEnterprise = tier === "enterprise";

  const handleSubscribe = async () => {
    if (isCurrentTier || isFree) return;

    setIsLoading(true);
    try {
      await onSubscribe(tier, billing);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-lg border p-6 ${
        info.popular
          ? "border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent"
          : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
      }`}
    >
      {/* Popular Badge */}
      {info.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium text-black">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{info.name}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{info.tagline}</p>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        {isFree ? (
          <div className="text-3xl font-bold text-[var(--text-primary)]">Free</div>
        ) : isEnterprise ? (
          <div className="text-3xl font-bold text-[var(--text-primary)]">Custom</div>
        ) : prices ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                ₱
                {billing === "monthly"
                  ? prices.monthly.php.toLocaleString()
                  : Math.round(prices.annual.php / 12).toLocaleString()}
              </span>
              <span className="text-[var(--text-secondary)]">/month</span>
            </div>
            {billing === "annual" && (
              <p className="mt-1 text-sm text-emerald-400">
                Billed ₱{prices.annual.php.toLocaleString()}/year (save 2
                months)
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* Billing Toggle (for non-free tiers) */}
      {prices && (
        <div className="mb-6 flex rounded-md border border-[var(--border-subtle)] p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              billing === "annual"
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Annual
          </button>
        </div>
      )}

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {info.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleSubscribe}
        disabled={isCurrentTier || isLoading}
        className={`w-full rounded-md py-2.5 font-medium transition-all ${
          isCurrentTier
            ? "cursor-default border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            : info.popular
              ? "bg-cyan-500 text-black hover:bg-cyan-400"
              : isFree
                ? "border border-[var(--border-active)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                : isEnterprise
                  ? "border border-[var(--border-active)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                  : "bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isLoading
          ? "Processing..."
          : isCurrentTier
            ? "Current Plan"
            : isFree
              ? "Get Started"
              : isEnterprise
                ? "Contact Sales"
                : "Subscribe"}
      </button>
    </div>
  );
}
