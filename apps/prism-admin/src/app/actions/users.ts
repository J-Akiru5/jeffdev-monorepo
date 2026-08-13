"use server";

import { revalidatePath } from "next/cache";
import { getPrismDb } from "@syntaxure-labs/db/prism";

/**
 * Note: this used to update a Cosmos DB `users` collection keyed by a Mongo
 * ObjectId, which was a separate record from the one the rest of Prism reads
 * tier from (`subscriptions`/now `prism_subscriptions`, keyed by Supabase
 * user id) — so this admin control never actually affected what the app
 * enforced. It's been pointed at `user_profiles` (keyed by the real Supabase
 * user id) during the Postgres migration, which is at least consistent and
 * queryable, but the underlying disconnect from `prism_subscriptions.tier`
 * is a pre-existing product question, not something fixed here.
 */
export async function overrideUserTier(
  userId: string,
  tier: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getPrismDb();
    const { error } = await db
      .from("user_profiles")
      .update({ tier, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[users] overrideUserTier error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to override tier",
    };
  }
}

export async function toggleUserStatus(
  userId: string,
  currentStatus: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const db = getPrismDb();
    const { error } = await db
      .from("user_profiles")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[users] toggleUserStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

export async function clearAppCache(): Promise<{ success: boolean; message: string }> {
  revalidatePath("/");
  return { success: true, message: "Cache cleared successfully. All pages will be revalidated on next request." };
}
