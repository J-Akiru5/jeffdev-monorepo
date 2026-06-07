"use server";

/**
 * Users Server Actions (Stub)
 * ----------------------------
 * Placeholder for user functionality.
 */

import { getAdminClient } from "@/lib/supabase/admin";

export async function getPublicNamecard(username: string) {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("user_profiles")
      .select("*")
      .eq("username", username)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
