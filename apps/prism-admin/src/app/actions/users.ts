"use server";

import { revalidatePath } from "next/cache";
import { getPrismDb } from "@syntaxure-labs/db/prism";

/**
 * Override a user's subscription tier.
 *
 * Writes prism_subscriptions — the table the engine actually enforces
 * (authenticate() and getUserTier() both read it, status-filtered) — using
 * the same upsert shape as engine's own /api/admin/subscription handler.
 * user_profiles.tier is updated secondarily for display consistency only;
 * it has no enforcement effect.
 */
export async function overrideUserTier(
  userId: string,
  tier: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getPrismDb();
    const now = new Date().toISOString();

    // Primary write: what the product enforces.
    const { error: subError } = await db.from("prism_subscriptions").upsert(
      {
        user_id: userId,
        tier,
        status: "active",
        modified_by: "prism-admin",
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
    if (subError) throw subError;

    // Secondary sync: display-only; failures here are non-fatal.
    await db
      .from("user_profiles")
      .update({ tier, updated_at: now })
      .eq("id", userId);

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
