import { CTA } from "./cta";
import { getActiveAvailability } from "@/lib/availability";

interface CTASectionProps {
  cmsCta?: {
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
}

export async function CTASection({ cmsCta }: CTASectionProps) {
  const availability = await getActiveAvailability();
  return (
    <CTA
      availabilityText={availability?.ctaText ?? null}
      cmsCta={cmsCta}
    />
  );
}
