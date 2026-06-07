/**
 * Testimonials Server Actions (Public)
 * --------------------------------------
 * Read-only actions for the public testimonials section.
 */

"use server";

import { getAdminClient } from "@/lib/supabase/admin";

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  quote: string;
  avatar_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data || []) as Testimonial[];
  } catch (error) {
    console.error("[GET TESTIMONIALS ERROR]", error);
    return [];
  }
}
