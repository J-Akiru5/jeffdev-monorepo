/**
 * Pricing Data — Database-backed with hardcoded fallback
 *
 * Fetches pricing plans and FAQs from Supabase's pricing_plans / pricing_faqs tables.
 * Falls back to hardcoded data when DB is unavailable.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

// =============================================================================
// RAW DB TYPES
// =============================================================================

interface DBPricingPlan {
  id: string;
  name: string;
  tier_slug: string;
  tagline: string | null;
  description: string | null;
  price_monthly_usd: number | null;
  price_annual_usd: number | null;
  price_monthly_php: number | null;
  price_annual_php: number | null;
  features: unknown;
  comparison_values: Record<string, unknown>;
  cta_label: string | null;
  cta_href: string | null;
  cta_variant: string;
  highlighted: boolean;
  sort_order: number;
}

interface DBPricingFAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export interface PricingPlanData {
  name: string;
  tagline: string;
  tier_slug: string;
  price: {
    monthly: number | null;
    annual: number | null;
  };
  pricePhp: {
    monthly: number | null;
    annual: number | null;
  };
  features: string[];
  popular: boolean;
  cta: string;
  href: string;
}

export interface ComparisonRow {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
  enterprise: string | boolean;
}

export interface PricingFAQItem {
  question: string;
  answer: string;
}

const FALLBACK_PLANS: PricingPlanData[] = [
  {
    name: "Free",
    tagline: "Get started with the basics",
    tier_slug: "free",
    price: { monthly: 0, annual: 0 },
    pricePhp: { monthly: 0, annual: 0 },
    features: ["10 rules", "5 components", "1 project", "Local enforcement on every agent write", "Export as Markdown"],
    popular: false,
    cta: "Get Started",
    href: "/sign-up",
  },
  {
    name: "Pro",
    tagline: "For serious developers",
    tier_slug: "pro",
    price: { monthly: 12, annual: 120 },
    pricePhp: { monthly: 660, annual: 6600 },
    features: ["100 rules", "50 components", "5 projects", "500 AI generations/month", "IDE auto-sync (MCP)", "All design systems", "All stack templates", "Priority support"],
    popular: true,
    cta: "Start Free Trial",
    href: "/sign-up",
  },
  {
    name: "Team",
    tagline: "Collaborate with your team",
    tier_slug: "team",
    price: { monthly: 36, annual: 360 },
    pricePhp: { monthly: 1980, annual: 19800 },
    features: ["Everything in Pro", "Unlimited projects", "2,000 AI generations/month", "Up to 10 team members", "Shared component library", "Team rule management", "Admin dashboard"],
    popular: false,
    cta: "Start Free Trial",
    href: "/sign-up",
  },
  {
    name: "Enterprise",
    tagline: "Custom solutions for scale",
    tier_slug: "enterprise",
    price: { monthly: null, annual: null },
    pricePhp: { monthly: null, annual: null },
    features: ["Everything in Team", "Unlimited team members", "Unlimited AI generations", "SSO/SAML", "Audit logs", "Dedicated support", "Custom integrations"],
    popular: false,
    cta: "Contact Sales",
    href: "https://www.syntaxure.dev/contact",
  },
];

const FALLBACK_COMPARISON: ComparisonRow[] = [
  { name: "Rules", free: "10", pro: "100", team: "Unlimited", enterprise: "Unlimited" },
  { name: "Components", free: "5", pro: "50", team: "Unlimited", enterprise: "Unlimited" },
  { name: "Projects", free: "1", pro: "5", team: "Unlimited", enterprise: "Unlimited" },
  { name: "AI Generations/mo", free: "0", pro: "500", team: "2,000", enterprise: "Unlimited" },
  { name: "IDE Auto-sync", free: false, pro: true, team: true, enterprise: true },
  { name: "Team Members", free: "-", pro: "-", team: "10", enterprise: "Unlimited" },
  { name: "Shared Library", free: false, pro: false, team: true, enterprise: true },
  { name: "SSO/SAML", free: false, pro: false, team: false, enterprise: true },
  { name: "Audit Logs", free: false, pro: false, team: false, enterprise: true },
  { name: "Priority Support", free: false, pro: true, team: true, enterprise: true },
  { name: "Dedicated Support", free: false, pro: false, team: false, enterprise: true },
];

const FALLBACK_FAQS: PricingFAQItem[] = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time. You'll retain access until the end of your billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept PayPal, which supports credit cards, debit cards, and PayPal balance.",
  },
  {
    question: "Can I upgrade or downgrade later?",
    answer: "Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your rules and components remain accessible in read-only mode for 30 days. You can always export them or resubscribe to regain full access.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 14-day money-back guarantee for annual subscriptions. Monthly subscriptions can be cancelled anytime but are non-refundable for the current period.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Pro and Team plans include a 7-day free trial. No credit card required to start.",
  },
];

// =============================================================================
// FETCHERS
// =============================================================================

async function getPricingClient() {
  const admin = getAdminClient();
  if (admin) {
    return admin;
  }

  // Fallback to regular server client when service role is not configured.
  return await createServerClient();
}

async function fetchPlans(): Promise<DBPricingPlan[]> {
  try {
    const client = await getPricingClient();
    const { data, error } = await client
      .from("pricing_plans")
      .select("*")
      .eq("app", "prism-engine")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data || []) as DBPricingPlan[];
  } catch (error) {
    console.error("[pricing-db] Failed to fetch from DB:", error);
    return [];
  }
}

async function fetchFAQs(): Promise<DBPricingFAQ[]> {
  try {
    const client = await getPricingClient();
    const { data, error } = await client
      .from("pricing_faqs")
      .select("*")
      .eq("app", "prism-engine")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data || []) as DBPricingFAQ[];
  } catch (error) {
    console.error("[pricing-db] Failed to fetch FAQs from DB:", error);
    return [];
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

export async function getPricingPlans(): Promise<PricingPlanData[]> {
  const dbPlans = await fetchPlans();
  if (dbPlans.length === 0) return FALLBACK_PLANS;

  return dbPlans.map((plan) => ({
    name: plan.name,
    tagline: plan.tagline || "",
    tier_slug: plan.tier_slug,
    price: {
      monthly: plan.price_monthly_usd,
      annual: plan.price_annual_usd,
    },
    pricePhp: {
      monthly: plan.price_monthly_php,
      annual: plan.price_annual_php,
    },
    features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
    popular: plan.highlighted,
    cta: plan.cta_label || "Get Started",
    href: plan.cta_href || "/sign-up",
  }));
}

/**
 * Human-readable labels for comparison table DB keys.
 * Keys not in this map fall back to auto-generated names.
 */
const COMPARISON_KEY_LABELS: Record<string, string> = {
  rules: 'Rules',
  components: 'Components',
  projects: 'Projects',
  ai: 'AI Generations/mo',
  ideSync: 'IDE Auto-sync',
  teamMembers: 'Team Members',
  sharedLibrary: 'Shared Library',
  sso: 'SSO/SAML',
  auditLogs: 'Audit Logs',
  prioritySupport: 'Priority Support',
  dedicatedSupport: 'Dedicated Support',
};

/**
 * Build comparison table from all plans' comparison_values
 */
export async function getComparisonTable(): Promise<ComparisonRow[]> {
  const dbPlans = await fetchPlans();
  if (dbPlans.length === 0) return FALLBACK_COMPARISON;

  const tierSlugs = ["free", "pro", "team", "enterprise"];
  const keySet = new Set<string>();

  const planMap = new Map<string, DBPricingPlan>();
  for (const plan of dbPlans) {
    planMap.set(plan.tier_slug, plan);
    if (plan.comparison_values) {
      Object.keys(plan.comparison_values).forEach((k) => keySet.add(k));
    }
  }

  const rows: ComparisonRow[] = [];
  for (const key of keySet) {
    const name = COMPARISON_KEY_LABELS[key] ?? (key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"));
    const row: ComparisonRow = {
      name,
      free: "",
      pro: "",
      team: "",
      enterprise: "",
    };

    for (const slug of tierSlugs) {
      const plan = planMap.get(slug);
      const val = plan?.comparison_values?.[key];
      (row as unknown as Record<string, unknown>)[slug] =
        val !== undefined ? (val as string | boolean) : "";
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Fetch FAQ items from DB, falling back to hardcoded list
 */
export async function getPricingFAQs(): Promise<PricingFAQItem[]> {
  const dbFaqs = await fetchFAQs();
  if (dbFaqs.length === 0) return FALLBACK_FAQS;

  return dbFaqs.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  }));
}
