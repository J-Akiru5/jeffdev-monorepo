'use client';

/**
 * PricingCard Component
 * ----------------------
 * Hostinger-style pricing card with:
 * - Discount badge
 * - Price display (original strikethrough + discounted)
 * - Feature checklist
 * - Ghost Glow CTA button
 * - "Most Popular" ribbon
 */

import Link from 'next/link';
import { Check, X, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingTier } from '@/data/pricing';

interface PricingCardProps {
  tier: PricingTier;
  currency: 'php' | 'usd';
}

export function PricingCard({ tier, currency }: PricingCardProps) {
  const price = tier.price[currency];
  const currencySymbol = currency === 'php' ? '₱' : '$';
  const isEnterprise = tier.id === 'enterprise';

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('en-US');
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border transition-all duration-300',
        tier.popular
          ? 'border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent shadow-[0_0_40px_rgba(6,182,212,0.15)]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
      )}
    >
      {/* Popular Badge */}
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg">
            Most Popular
          </div>
        </div>
      )}

      {/* Discount Badge */}
      {tier.discountLabel && (
        <div className="absolute right-4 top-4">
          <span className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400">
            {tier.discountLabel}
          </span>
        </div>
      )}

      {/* Card Content */}
      <div className={cn('flex flex-1 flex-col p-6', tier.popular && 'pt-8')}>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white">{tier.name}</h3>
          <p className="mt-1 text-sm text-white/50">{tier.tagline}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          {isEnterprise ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">Custom</span>
              <span className="text-sm text-white/50">pricing</span>
            </div>
          ) : (
            <>
              {/* Original price (strikethrough) */}
              {price.discounted && (
                <div className="text-sm text-white/40 line-through">
                  {currencySymbol}
                  {formatPrice(price.original)}
                </div>
              )}
              {/* Discounted / Current price */}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {currencySymbol}
                  {formatPrice(price.discounted || price.original)}
                </span>
                <span className="text-sm text-white/50">one-time</span>
              </div>
              {/* Monthly addon text */}
              {tier.monthlyAddon && (
                <div className="mt-1 text-sm font-medium text-cyan-400">
                  {tier.monthlyAddon}
                </div>
              )}
            </>
          )}
        </div>

        {/* Limited Deal Badge */}
        {tier.limitedDeal && (
          <div className="mb-6 rounded-md bg-purple-500/10 px-3 py-2 text-center text-xs font-medium text-purple-400">
            Limited time deal
          </div>
        )}

        {/* CTA Button */}
        <Link
          href={tier.cta.href}
          className={cn(
            'group relative mb-6 flex items-center justify-center gap-2 overflow-hidden rounded-md px-6 py-3 font-medium transition-all',
            tier.cta.variant === 'primary'
              ? 'bg-white text-black hover:bg-white/90'
              : tier.cta.variant === 'contact'
              ? 'border border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/5'
              : 'border border-white/10 bg-black/50 text-white hover:border-white/20'
          )}
        >
          {tier.cta.label}
          {tier.cta.variant !== 'contact' && (
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          )}
        </Link>

        {/* Feature Label */}
        <div className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">
          {isEnterprise ? 'Everything in Custom, plus:' : 'What you get:'}
        </div>

        {/* Features List */}
        <ul className="flex-1 space-y-3">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              {feature.included ? (
                <Check
                  className={cn(
                    'mt-0.5 h-4 w-4 flex-shrink-0',
                    feature.highlight ? 'text-cyan-400' : 'text-emerald-400'
                  )}
                />
              ) : (
                <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/20" />
              )}
              <span
                className={cn(
                  feature.included ? 'text-white/80' : 'text-white/30',
                  feature.highlight && 'font-medium text-white'
                )}
              >
                {feature.label}
                {feature.highlight && (
                  <span className="ml-2 rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs text-cyan-400">
                    NEW
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PricingCard;
