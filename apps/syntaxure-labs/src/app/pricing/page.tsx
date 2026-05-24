import { getPricingTiers, getCarePlan, getComparisonTable, getPricingFAQs } from "@/lib/pricing-db";
import PricingPageContent from "./pricing-page-content";

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
