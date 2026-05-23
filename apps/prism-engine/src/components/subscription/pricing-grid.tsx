'use client';

/**
 * Pricing Grid Component
 * 
 * Displays all subscription tiers in a grid
 */

import { useRouter } from 'next/navigation';
import { PricingCard } from './pricing-card';
import type { SubscriptionTier } from '@/lib/subscriptions';

interface PricingGridProps {
  currentTier?: SubscriptionTier;
}

export function PricingGrid({ currentTier = 'free' }: PricingGridProps) {
  const router = useRouter();

  const handleSubscribe = async (tier: SubscriptionTier, billing: 'monthly' | 'annual') => {
    if (tier === 'enterprise') {
      router.push('/contact?subject=enterprise');
      return;
    }

    if (tier === 'free') {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billing }),
      });

      const data = await response.json();

      if (data.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl;
      } else if (data.redirect) {
        router.push(data.redirect);
      } else {
        console.error('No approval URL returned');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <PricingCard
        tier="free"
        currentTier={currentTier}
        onSubscribe={handleSubscribe}
      />
      <PricingCard
        tier="pro"
        currentTier={currentTier}
        onSubscribe={handleSubscribe}
      />
      <PricingCard
        tier="team"
        currentTier={currentTier}
        onSubscribe={handleSubscribe}
      />
      <PricingCard
        tier="enterprise"
        currentTier={currentTier}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}
