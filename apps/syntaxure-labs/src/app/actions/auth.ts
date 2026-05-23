"use server";

/**
 * Logout Action
 * Rewritten to use Supabase Auth
 * Clears session and signs out user.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
