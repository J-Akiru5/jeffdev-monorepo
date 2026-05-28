"use server";

/**
 * Profile Management Actions
 * ---------------------------
 * Server actions for updating user profile, changing password,
 * and managing avatar images.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionResult {
  success?: boolean;
  error?: string;
}

interface ProfileUpdateData {
  fullName?: string;
  bio?: string;
  companyName?: string;
  phone?: string;
  timezone?: string;
}

// ─── Update Profile ─────────────────────────────────────────────────────────

export async function updateProfile(data: ProfileUpdateData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName || null;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.companyName !== undefined) updateData.company_name = data.companyName || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.timezone !== undefined) updateData.timezone = data.timezone || "UTC";

    const { error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update profile" };
  }
}

// ─── Change Password ────────────────────────────────────────────────────────

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  try {
    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    if (currentPassword === newPassword) {
      return { error: "New password must be different from current password." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Update password directly — Supabase handles session freshness internally.
    // If re-authentication is needed, it returns a specific error.
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      // If the session is too old, tell the user to sign out and back in
      if (error.message?.toLowerCase().includes("re-authenticate") || error.message?.toLowerCase().includes("session")) {
        return {
          error: "Your session is too old to change the password. Please sign out and sign back in, then try again.",
        };
      }
      return { error: error.message };
    }

    return { success: true };
  } catch {
    return { error: "Failed to change password" };
  }
}

// ─── Update Avatar URL ──────────────────────────────────────────────────────

// ─── Update Default Theme (cross-app) ─────────────────────────────────────

export async function updateDefaultTheme(theme: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Fetch current preferences so we merge (not overwrite) other keys
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();

    const currentPrefs = (profile?.preferences as Record<string, unknown>) || {};
    const mergedPrefs = { ...currentPrefs, default_theme: theme };

    const { error } = await supabase
      .from("user_profiles")
      .update({ preferences: mergedPrefs })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update default theme" };
  }
}

export async function updateAvatarUrl(avatarUrl: string | null): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("user_profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update avatar" };
  }
}
