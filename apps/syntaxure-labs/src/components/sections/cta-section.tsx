import { CTA } from "./cta";
import { getActiveAvailability } from "@/lib/availability";

export async function CTASection() {
  const availability = await getActiveAvailability();
  return <CTA availabilityText={availability?.ctaText ?? null} />;
}
