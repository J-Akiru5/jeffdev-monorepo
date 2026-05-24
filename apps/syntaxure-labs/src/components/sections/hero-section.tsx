import { Hero } from "./hero";
import { getActiveAvailability } from "@/lib/availability";

export async function HeroSection() {
  const availability = await getActiveAvailability();
  return <Hero availabilityText={availability?.heroText ?? null} />;
}
