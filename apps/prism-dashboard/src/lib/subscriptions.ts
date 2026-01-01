/**
 * Subscription Types and Helpers
 */

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  paypalSubscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TierLimits {
  rules: number;
  components: number;
  projects: number;
  aiGenerations: number; // per month
  teamMembers: number;
  ideSync: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    rules: 5,
    components: 3,
    projects: 1,
    aiGenerations: 10,
    teamMembers: 0,
    ideSync: false,
  },
  pro: {
    rules: -1, // unlimited
    components: -1,
    projects: 10,
    aiGenerations: 500,
    teamMembers: 0,
    ideSync: true,
  },
  team: {
    rules: -1,
    components: -1,
    projects: -1,
    aiGenerations: 2000,
    teamMembers: 10,
    ideSync: true,
  },
  enterprise: {
    rules: -1,
    components: -1,
    projects: -1,
    aiGenerations: -1,
    teamMembers: -1,
    ideSync: true,
  },
};

export const TIER_PRICES = {
  pro: {
    monthly: { php: 990, usd: 18 },
    annual: { php: 9900, usd: 180 },
  },
  team: {
    monthly: { php: 2990, usd: 54 },
    annual: { php: 29900, usd: 540 },
  },
  enterprise: {
    monthly: { php: null, usd: null }, // custom
    annual: { php: null, usd: null },
  },
};

export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits,
  currentUsage: number = 0
): boolean {
  const limit = TIER_LIMITS[tier][feature];
  
  if (typeof limit === 'boolean') {
    return limit;
  }
  
  if (limit === -1) {
    return true; // unlimited
  }
  
  return currentUsage < limit;
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: 'Free',
    pro: 'Pro',
    team: 'Team',
    enterprise: 'Enterprise',
  };
  return names[tier];
}
