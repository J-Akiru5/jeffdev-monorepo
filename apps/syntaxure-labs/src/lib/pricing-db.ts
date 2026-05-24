/**
 * Pricing Data — Database-backed with hardcoded fallback
 *
 * Fetches pricing plans and FAQs from Supabase's pricing_plans table.
 * Falls back to the original hardcoded data in data/pricing.ts.
 *
 * Usage:
 *   import { getPricingTiers, getCarePlan, getPricingFAQs } from '@/lib/pricing-db';
 */

import { getAdminClient } from '@/lib/supabase/admin';
import {
  pricingTiers as fallbackTiers,
  carePlan as fallbackCarePlan,
  pricingFAQ as fallbackFAQs,
  comparisonTable as fallbackComparison,
  type PricingTier,
  type CarePlan,
  type FAQItem,
  type ComparisonRow,
} from '@/data/pricing';

// =============================================================================
// RAW DB TYPES
// =============================================================================

interface DBPricingPlan {
  id: string;
  app: string;
  plan_type: string;
  name: string;
  tier_slug: string;
  tagline: string | null;
  description: string | null;
  price_monthly_php: number | null;
  price_monthly_usd: number | null;
  price_annual_php: number | null;
  price_annual_usd: number | null;
  price_original_php: number | null;
  price_original_usd: number | null;
  discount_label: string | null;
  monthly_addon: string | null;
  features: unknown;
  comparison_values: Record<string, unknown>;
  cta_label: string | null;
  cta_href: string | null;
  cta_variant: string;
  highlighted: boolean;
  limited_deal: boolean;
  sort_order: number;
}

interface DBFAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

// =============================================================================
// FETCHERS
// =============================================================================

async function fetchPlansFromDB(): Promise<DBPricingPlan[]> {
  try {
    const supabase = (await getAdminClient()) as any;
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('app', 'syntaxure-labs')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as DBPricingPlan[];
  } catch (error) {
    console.error('[pricing-db] Failed to fetch from DB, using fallback:', error);
    return [];
  }
}

async function fetchFAQsFromDB(): Promise<DBFAQ[]> {
  try {
    const supabase = (await getAdminClient()) as any;
    const { data, error } = await supabase
      .from('pricing_faqs')
      .select('*')
      .eq('app', 'syntaxure-labs')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as DBFAQ[];
  } catch (error) {
    console.error('[pricing-db] Failed to fetch FAQs from DB, using fallback:', error);
    return [];
  }
}

// =============================================================================
// PUBLIC API — maps DB rows to the same shape as data/pricing.ts
// =============================================================================

export async function getPricingTiers(): Promise<PricingTier[]> {
  const dbPlans = await fetchPlansFromDB();
  const tiers = dbPlans.filter((p) => p.plan_type === 'tier');

  if (tiers.length === 0) {
    return fallbackTiers;
  }

  return tiers.map((tier) => ({
    id: tier.tier_slug,
    name: tier.name,
    tagline: tier.tagline || '',
    price: {
      php: {
        original: tier.price_original_php ?? (tier.price_monthly_php ?? 0),
        discounted: tier.price_monthly_php,
      },
      usd: {
        original: tier.price_original_usd ?? (tier.price_monthly_usd ?? 0),
        discounted: tier.price_monthly_usd,
      },
    },
    discountLabel: tier.discount_label,
    monthlyAddon: tier.monthly_addon,
    features: Array.isArray(tier.features) ? tier.features as PricingTier['features'] : [],
    cta: {
      label: tier.cta_label || 'Choose plan',
      href: tier.cta_href || `/quote?tier=${tier.tier_slug}`,
      variant: (tier.cta_variant as PricingTier['cta']['variant']) || 'secondary',
    },
    popular: tier.highlighted,
    limitedDeal: tier.limited_deal,
  }));
}

export async function getCarePlan(): Promise<CarePlan> {
  const dbPlans = await fetchPlansFromDB();
  const carePlan = dbPlans.find((p) => p.plan_type === 'addon');

  if (!carePlan) {
    return fallbackCarePlan;
  }

  // Parse comparison_values for price ranges
  const priceRange = (carePlan.comparison_values as Record<string, number>) || {};
  const features = Array.isArray(carePlan.features)
    ? (carePlan.features as string[])
    : [];

  return {
    name: carePlan.name,
    tagline: carePlan.tagline || 'Protect your investment',
    description: carePlan.description || '',
    monthlyPrice: {
      php: {
        min: priceRange.minPhp || 2000,
        max: priceRange.maxPhp || 5000,
      },
      usd: {
        min: priceRange.minUsd || 35,
        max: priceRange.maxUsd || 90,
      },
    },
    features,
  };
}

// =============================================================================
// COMPARISON TABLE
// =============================================================================

/**
 * Human-readable labels for comparison table DB keys.
 * Keys not in this map fall back to auto-generated names.
 */
const COMPARISON_KEY_LABELS: Record<string, string> = {
  pages: 'Number of Pages',
  domain: 'Custom Domain',
  ssl: 'SSL Certificate',
  responsive: 'Mobile Responsive',
  seo: 'SEO Optimization',
  cms: 'CMS Integration',
  blog: 'Blog System',
  auth: 'User Authentication',
  admin: 'Admin Dashboard',
  payments: 'Payment Gateway',
  api: 'API Development',
  database: 'Database Integration',
  carePlan: 'Care Plan Included',
  support: 'Support Response',
  ownership: 'Source Code Ownership',
};

/**
 * Build comparison table from all plans' comparison_values
 */
export async function getComparisonTable(): Promise<ComparisonRow[]> {
  const dbPlans = await fetchPlansFromDB();
  const tiers = dbPlans.filter((p) => p.plan_type === 'tier');

  if (tiers.length === 0) {
    return fallbackComparison;
  }

  // Collect all comparison keys across all tiers
  const tierSlugs = ['starter', 'business', 'custom', 'enterprise'] as const;
  const keySet = new Set<string>();

  const planMap = new Map<string, DBPricingPlan>();
  for (const plan of tiers) {
    planMap.set(plan.tier_slug, plan);
    if (plan.comparison_values) {
      Object.keys(plan.comparison_values as Record<string, unknown>).forEach((k) => keySet.add(k));
    }
  }

  const rows: ComparisonRow[] = [];
  for (const key of keySet) {
    const label = COMPARISON_KEY_LABELS[key] ?? (key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'));
    const row: ComparisonRow = {
      feature: label,
      starter: '',
      business: '',
      custom: '',
      enterprise: '',
    };

    for (const slug of tierSlugs) {
      const plan = planMap.get(slug);
      const val = (plan?.comparison_values as Record<string, unknown>)?.[key];
      row[slug] = val !== undefined ? (val as string | boolean) : '';
    }

    rows.push(row);
  }

  return rows;
}

export async function getPricingFAQs(): Promise<FAQItem[]> {
  const dbFAQs = await fetchFAQsFromDB();

  if (dbFAQs.length === 0) {
    return fallbackFAQs;
  }

  return dbFAQs.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  }));
}
