"use server";

/**
 * Seed Actions
 * ------------
 * One-time setup actions for bootstrapping the database.
 * Use with caution - these should only run once.
 */

import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Bootstrap the current logged-in user as founder
 * This creates the user document if it doesn't exist
 */
export async function bootstrapCurrentUserAsFounder(
  uid: string,
  email: string,
  displayName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Check if user document already exists
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", uid)
      .maybeSingle();

    if (existingUser) {
      // Update existing document to founder role
      const { error: updateError } = await supabase
        .from("user_profiles")
      .update({
        role: "admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", uid);

      if (updateError) throw updateError;

      // Set app_metadata for role-based access
      await supabase.auth.admin.updateUserById(uid, {
        app_metadata: { role: "admin" },
      });

      return { success: true };
    }

    // Create new founder document
    const { error: insertError } = await supabase.from("user_profiles").insert({
      id: uid,
      email,
      full_name: displayName,
      role: "admin",
      company_name: "Syntaxure Labs",
      timezone: "Asia/Manila",
      preferences: {
        namecard: {},
        socials: {},
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    // Set app_metadata for role-based access
    await supabase.auth.admin.updateUserById(uid, {
      app_metadata: { role: "admin" },
    });

    return { success: true };
  } catch (error) {
    console.error("[BOOTSTRAP FOUNDER ERROR]", error);
    return { success: false, error: "Failed to bootstrap founder account" };
  }
}

/**
 * Update or create user profile
 * This is a more forgiving version that creates if not exists
 */
export async function upsertUserProfile(
  uid: string,
  data: {
    displayName?: string;
    photoURL?: string;
    title?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    socials?: {
      github?: string;
      linkedin?: string;
      twitter?: string;
    };
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id, preferences")
      .eq("id", uid)
      .maybeSingle();

    if (existingUser) {
      // Build update payload
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (data.displayName) updates.full_name = data.displayName;
      if (data.photoURL) updates.avatar_url = data.photoURL;
      if (data.bio) updates.bio = data.bio;
      if (data.phone) updates.phone = data.phone;
      if (data.location) updates.location = data.location;

      if (data.socials || data.title || data.website) {
        updates.preferences = {
          ...((existingUser as Record<string, unknown>).preferences as Record<
            string,
            unknown
          >),
          title: data.title,
          website: data.website,
          socials: data.socials,
        };
      }

      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", uid);

      if (error) throw error;
    } else {
      // Create new with defaults
      const { error } = await supabase.from("user_profiles").insert({
        id: uid,
        email: "",
        full_name: data.displayName || "",
        role: "employee",
        timezone: "UTC",
        preferences: {
          title: data.title || "",
          website: data.website || "",
          socials: data.socials || {},
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("[UPSERT USER PROFILE ERROR]", error);
    return { success: false, error: "Failed to update profile" };
  }
}
