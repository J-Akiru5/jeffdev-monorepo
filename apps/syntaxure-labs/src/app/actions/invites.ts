"use server";

/**
 * Invites Server Actions (Stub)
 * ------------------------------
 * Placeholder for invite functionality.
 */

import { getAdminClient } from "@/lib/supabase/admin";

export async function getInviteByToken(token: string) {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("invites")
      .select("*")
      .eq("token", token)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
