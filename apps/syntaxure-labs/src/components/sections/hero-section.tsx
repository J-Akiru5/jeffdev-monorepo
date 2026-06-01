import { Hero } from "./hero";
import { getActiveAvailability } from "@/lib/availability";

interface HeroSectionProps {
  cmsHero?: {
    tagline?: string;
    heading1?: string;
    heading2?: string;
    description?: string;
  };
}

export async function HeroSection({ cmsHero }: HeroSectionProps) {
  const availability = await getActiveAvailability();
  return (
    <Hero
      availabilityText={availability?.heroText ?? null}
      cmsHero={cmsHero}
    />
  );
}
