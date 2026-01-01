/**
 * Service Types with Pricing Tiers
 * ---------------------------------
 * Productized services structure for agency offerings.
 */

export type PricingTier = 'starter' | 'pro' | 'enterprise';

export interface ServiceTierPricing {
  tier: PricingTier;
  price: number;          // Base price in USD
  features: string[];     // Features included in this tier
  deliveryDays: number;   // Estimated delivery in days
  revisions: number;      // Number of revisions included
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface Service {
  id?: string;
  slug: string;
  name: string;
  tagline: string;           // Short description for cards
  description: string;       // Full description
  categoryId?: string;       // Service category
  icon?: string;             // Lucide icon name
  image?: string;            // Featured image URL
  
  // Pricing tiers
  pricing: ServiceTierPricing[];
  
  // Features breakdown
  highlights: string[];      // Key selling points
  
  // Tech stack (optional)
  technologies?: string[];
  
  // Display settings
  featured: boolean;
  order: number;
  status: 'draft' | 'published' | 'archived';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Tier metadata for display
export const tierMetadata: Record<PricingTier, { label: string; className: string; description: string }> = {
  starter: {
    label: 'Starter',
    className: 'bg-white/10 text-white/60 border-white/20',
    description: 'Perfect for MVPs and personal projects',
  },
  pro: {
    label: 'Pro',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'Best for growing startups and SMBs',
  },
  enterprise: {
    label: 'Enterprise',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'For large-scale and mission-critical projects',
  },
};

// Default tier pricing template
export const defaultTierPricing: ServiceTierPricing[] = [
  {
    tier: 'starter',
    price: 499,
    features: ['Core functionality', 'Basic support', '1 revision'],
    deliveryDays: 14,
    revisions: 1,
  },
  {
    tier: 'pro',
    price: 1499,
    features: ['All Starter features', 'Priority support', '3 revisions', 'Source code'],
    deliveryDays: 21,
    revisions: 3,
  },
  {
    tier: 'enterprise',
    price: 4999,
    features: ['All Pro features', 'Dedicated manager', 'Unlimited revisions', 'Custom SLA'],
    deliveryDays: 45,
    revisions: -1, // Unlimited
  },
];
