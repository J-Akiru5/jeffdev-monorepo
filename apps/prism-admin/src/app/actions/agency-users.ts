"use server";

/**
 * Agency User & Invite Server Actions
 * ------------------------------------
 * User profile management, invites, and role management.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import type { UserProfileRow } from "@/lib/database.types";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  title?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  role: "founder" | "admin" | "partner" | "employee";
  status: "active" | "inactive" | "pending";
  assignedProjects?: string[];
  created_at: string;
  updated_at: string;
  lastLoginAt?: string;
};

type ActionResult = { success: boolean; error?: string; inviteId?: string; token?: string };

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getAgencyUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", uid).single();
    if (error || !data) return null;
    const prefs = (data.preferences || {}) as Record<string, unknown>;
    return {
      uid: data.id,
      email: data.email || "",
      displayName: data.full_name || "",
      photoURL: data.avatar_url ?? undefined,
      bio: data.bio ?? undefined,
      title: prefs.title as string,
      phone: data.phone ?? undefined,
      location: prefs.location as string,
      timezone: data.timezone ?? undefined,
      role: data.role as UserProfile["role"],
      status: (prefs.status as UserProfile["status"]) || "active",
      assignedProjects: prefs.assigned_projects as string[],
      created_at: data.created_at,
      updated_at: data.updated_at,
      lastLoginAt: (data as unknown as Record<string, unknown>).last_sign_in_at as string | undefined,
    };
  } catch (error) {
    console.error("[GET AGENCY USER PROFILE ERROR]", error);
    return null;
  }
}

export async function updateAgencyUserProfile(uid: string, data: Partial<UserProfile>): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { data: existing } = await supabase.from("user_profiles").select("preferences").eq("id", uid).maybeSingle();
    const existingPrefs = (existing?.preferences || {}) as Record<string, unknown>;

    const updatePayload: Partial<UserProfileRow> & Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.displayName !== undefined) updatePayload.full_name = data.displayName;
    if (data.photoURL !== undefined) updatePayload.avatar_url = data.photoURL;
    if (data.bio !== undefined) updatePayload.bio = data.bio;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;
    if (data.email !== undefined) updatePayload.email = data.email;

    const newPrefs = { ...existingPrefs };
    if (data.title !== undefined) newPrefs.title = data.title;
    if (data.location !== undefined) newPrefs.location = data.location;
    if (data.status !== undefined) newPrefs.status = data.status;
    if (data.assignedProjects !== undefined) newPrefs.assigned_projects = data.assignedProjects;
    updatePayload.preferences = newPrefs;

    const { error } = await supabase.from("user_profiles").update(updatePayload).eq("id", uid);
    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("[UPDATE AGENCY USER PROFILE ERROR]", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// ─── All Users ────────────────────────────────────────────────────────────────

export async function getAgencyAllUsers(): Promise<UserProfile[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((doc) => ({
      uid: doc.id,
      email: doc.email || "",
      displayName: doc.full_name || "",
      photoURL: doc.avatar_url ?? undefined,
      bio: doc.bio ?? undefined,
      phone: doc.phone ?? undefined,
      timezone: doc.timezone ?? undefined,
      role: doc.role as UserProfile["role"],
      status: "active",
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    }));
  } catch (error) {
    console.error("[GET ALL USERS ERROR]", error);
    return [];
  }
}

// ─── Invites ──────────────────────────────────────────────────────────────────

function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createAgencyInvite(data: { email: string; role: string; invitedBy: string; projectName?: string }): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    if (data.role === "founder") return { success: false, error: "Cannot create founder invites" };

    const { data: existingUser } = await supabase.from("user_profiles").select("id").eq("email", data.email).maybeSingle();
    if (existingUser) return { success: false, error: "User with this email already exists" };

    const { data: existingInvite } = await supabase.from("invites").select("id").eq("email", data.email).eq("status", "pending").maybeSingle();
    if (existingInvite) return { success: false, error: "Pending invite already exists for this email" };

    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: inviteResult, error } = await supabase.from("invites").insert({
      user_id: data.invitedBy,
      email: data.email,
      role: data.role,
      token,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select("id").single();

    if (error) throw error;

    await logAuditEvent({ action: "CREATE", resource: "users", resourceId: inviteResult.id, details: { email: data.email, role: data.role, type: "invite" } });
    revalidatePath("/admin/agency/users");

    return { success: true, inviteId: inviteResult.id, token };
  } catch (error) {
    console.error("[CREATE INVITE ERROR]", error);
    return { success: false, error: "Failed to create invite" };
  }
}

export async function getAgencyInvites(): Promise<{ id: string; email: string; role: string; status: string; expiresAt: string; createdAt: string }[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("invites").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error("[GET INVITES ERROR]", error);
    return [];
  }
}

export async function revokeAgencyInvite(inviteId: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("invites").update({ status: "expired" }).eq("id", inviteId);
    if (error) throw error;
    revalidatePath("/admin/agency/users");
    return { success: true };
  } catch (error) {
    console.error("[REVOKE INVITE ERROR]", error);
    return { success: false, error: "Failed to revoke invite" };
  }
}

export async function updateAgencyUserRole(uid: string, newRole: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("user_profiles").update({ role: newRole, updated_at: new Date().toISOString() }).eq("id", uid);
    if (error) throw error;
    await supabase.auth.admin.updateUserById(uid, { app_metadata: { role: newRole } });
    await logAuditEvent({ action: "UPDATE", resource: "users", resourceId: uid, details: { newRole } });
    revalidatePath("/admin/agency/users");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE USER ROLE ERROR]", error);
    return { success: false, error: "Failed to update role" };
  }
}

export async function deactivateAgencyUser(uid: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { data: existing } = await supabase.from("user_profiles").select("preferences").eq("id", uid).maybeSingle();
    const existingPrefs = (existing?.preferences || {}) as Record<string, unknown>;
    const { error } = await supabase.from("user_profiles").update({ preferences: { ...existingPrefs, status: "inactive" }, updated_at: new Date().toISOString() }).eq("id", uid);
    if (error) throw error;
    await supabase.auth.admin.updateUserById(uid, { ban_duration: "24h" });
    revalidatePath("/admin/agency/users");
    return { success: true };
  } catch (error) {
    console.error("[DEACTIVATE USER ERROR]", error);
    return { success: false, error: "Failed to deactivate user" };
  }
}
