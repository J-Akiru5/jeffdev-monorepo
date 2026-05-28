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
          ? `Currently accepting new projects`
          : `Fully Booked`,
      heroText:
        remaining > 0
          ? `Currently accepting new projects`
          : `Fully Booked`,
      aboutText:
        remaining > 0
          ? `Currently accepting new projects`
          : `Fully Booked`,
    };
  } catch {
    return null;
  }
}
