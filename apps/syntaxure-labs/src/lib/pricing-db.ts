/**
 * Pricing Database Utilities (Stub)
 * -----------------------------------
 * Placeholder for pricing database functionality.
 */

import type { PricingTier, CarePlan, ComparisonRow, FAQItem } from "@/data/pricing";

export async function getPricingTiers(): Promise<PricingTier[]> {
  return [];
}

export async function getCarePlan(): Promise<CarePlan> {
  return {
    name: "Care Plan",
    tagline: "Ongoing support & maintenance",
    description: "Keep your product running smoothly with our comprehensive care plan.",
    monthlyPrice: {
      php: { min: 15000, max: 50000 },
      usd: { min: 300, max: 1000 },
    },
    features: [
      "Priority bug fixes",
      "Security updates",
      "Performance monitoring",
      "Monthly reports",
    ],
  };
}

export async function getComparisonTable(): Promise<ComparisonRow[]> {
  return [];
}

export async function getPricingFAQs(): Promise<FAQItem[]> {
  return [];
}
