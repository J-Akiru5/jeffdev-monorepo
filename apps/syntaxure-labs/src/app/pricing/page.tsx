/**
 * Pricing Page (Server Component)
 * ---------------------------------
 * Fetches pricing data from Supabase via pricing-db.ts,
 * falls back to hardcoded data when DB is unavailable.
 * Renders the client-side PricingPageContent with all data as props.
 */

import { getPricingTiers, getCarePlan, getComparisonTable, getPricingFAQs } from '@/lib/pricing-db';
import PricingPageContent from './pricing-page-content';

export default async function PricingPage() {
  const [pricingTiers, carePlan, comparisonTable, pricingFAQ] = await Promise.all([
    getPricingTiers(),
    getCarePlan(),
    getComparisonTable(),
    getPricingFAQs(),
  ]);

  return (
    <PricingPageContent
      pricingTiers={pricingTiers}
      carePlan={carePlan}
      comparisonTable={comparisonTable}
      pricingFAQ={pricingFAQ}
    />
  );
}
