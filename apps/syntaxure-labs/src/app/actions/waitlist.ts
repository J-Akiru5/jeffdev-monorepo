"use server";

/**
 * Waitlist Server Actions (Stub)
 * -------------------------------
 * Placeholder for waitlist functionality.
 */

import { getAdminClient } from "@/lib/supabase/admin";

export async function joinWaitlist(data: string | { email: string }) {
  try {
    const email = typeof data === "string" ? data : data.email;
    const supabase = getAdminClient();
    const { error } = await (supabase as any).from("waitlist").insert({
      email,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true, message: "Added to waitlist!" };
  } catch {
    return { success: false, error: "Failed to join waitlist", message: "Failed to join waitlist" };
  }
}
