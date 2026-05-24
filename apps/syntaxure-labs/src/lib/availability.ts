import { createClient } from "@/lib/supabase/server";

export interface ActiveAvailability {
  quarterLabel: string;
  totalSlots: number;
  filledSlots: number;
  remaining: number;
  hasAvailability: boolean;
  ctaText: string;
  heroText: string;
  aboutText: string;
}

export async function getActiveAvailability(): Promise<ActiveAvailability | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error || !data) return null;

    const total = data.total_slots as number;
    const filled = data.filled_slots as number;
    const remaining = total - filled;
    const label = data.quarter_label as string;

    return {
      quarterLabel: label,
      totalSlots: total,
      filledSlots: filled,
      remaining,
      hasAvailability: remaining > 0,
      ctaText:
        remaining > 0
          ? `${remaining} Slots Available for ${label}`
          : `Fully Booked for ${label}`,
      heroText:
        remaining > 0
          ? `Available for ${label} Projects`
          : `Fully Booked for ${label}`,
      aboutText:
        remaining > 0
          ? `Available for ${label} projects`
          : `Fully Booked for ${label}`,
    };
  } catch {
    return null;
  }
}
