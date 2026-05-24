/**
 * Pricing Data Helpers
 *
 * Shared functions to fetch pricing plans and FAQs from Supabase.
 * Falls back to hardcoded data if the DB is unavailable.
 */

import { getAdminClient } from "./supabase/admin";

// =============================================================================
// TYPES
// =============================================================================

export interface PricingPlan {
  id: string;
  app: "prism-engine" | "syntaxure-labs";
  plan_type: "tier" | "addon";
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
  features: unknown[];
  comparison_values: Record<string, unknown>;
  cta_label: string | null;
  cta_href: string | null;
  cta_variant: "primary" | "secondary" | "contact";
  highlighted: boolean;
  limited_deal: boolean;
  sort_order: number;
}

export interface PricingFAQ {
  id: string;
  app: "prism-engine" | "syntaxure-labs";
  question: string;
  answer: string;
  sort_order: number;
}

// =============================================================================
// FETCHERS
// =============================================================================

export async function getPricingPlans(
  app: "prism-engine" | "syntaxure-labs",
): Promise<PricingPlan[]> {
  try {
    const client = getAdminClient() as any;
    const { data, error } = await client
      .from("pricing_plans")
      .select("*")
      .eq("app", app)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data || []) as PricingPlan[];
  } catch (error) {
    console.error(`[pricing] Failed to fetch plans for ${app}:`, error);
    return [];
  }
}

export async function getPricingFAQs(
  app: "prism-engine" | "syntaxure-labs",
): Promise<PricingFAQ[]> {
  try {
    const client = getAdminClient() as any;
    const { data, error } = await client
      .from("pricing_faqs")
      .select("*")
      .eq("app", app)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data || []) as PricingFAQ[];
  } catch (error) {
    console.error(`[pricing] Failed to fetch FAQs for ${app}:`, error);
    return [];
  }
}

/**
 * Get a single pricing plan by tier_slug
 */
export async function getPricingPlanBySlug(
  app: "prism-engine" | "syntaxure-labs",
  slug: string,
): Promise<PricingPlan | null> {
  try {
    const client = getAdminClient() as any;
    const { data, error } = await client
      .from("pricing_plans")
      .select("*")
      .eq("app", app)
      .eq("tier_slug", slug)
      .maybeSingle();

    if (error) throw error;
    return (data as PricingPlan) || null;
  } catch (error) {
    console.error(`[pricing] Failed to fetch plan ${slug}:`, error);
    return null;
  }
}
