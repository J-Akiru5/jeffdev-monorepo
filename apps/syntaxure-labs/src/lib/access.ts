/**
 * Access Control Utilities
 * Rewritten to use Supabase Auth
 * Server-side helpers for route protection and permission checks.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, Permission } from "@/types/rbac";
import { rolePermissions } from "@/types/rbac";

// Founder UID - locked to single account
const FOUNDER_UID = process.env.FOUNDER_UID || "founder-001";

interface SessionUser {
  uid: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  assignedProjects: string[];
}

/**
 * Get current user from Supabase session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch user profile from user_profiles table
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // User authenticated but no profile - might be new signup
      return null;
    }

    return {
      uid: user.id,
      email: user.email || "",
      role: profile.role,
      permissions: profile.permissions || [],
      assignedProjects: profile.assigned_projects || [],
    };
  } catch (error) {
    console.error("[GET CURRENT USER ERROR]", error);
    return null;
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: SessionUser | null,
  permission: Permission,
): boolean {
  if (!user) return false;

  // Check explicit permissions first
  if (user.permissions.includes(permission)) return true;

  // Fall back to role defaults
  return rolePermissions[user.role]?.includes(permission) ?? false;
}

/**
 * Check if user can access a project
 */
export function canAccessProject(
  user: SessionUser | null,
  projectSlug: string,
): boolean {
  if (!user) return false;

  // Founder and admin can access all
  if (user.role === "founder" || user.role === "admin") return true;

  // Partner/employee only assigned projects
  return user.assignedProjects.includes(projectSlug);
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

/**
 * Require specific permission - redirect to 403 if not authorized
 */
export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasPermission(user, permission)) {
    redirect("/forbidden");
  }
  return user;
}

/**
 * Require Founder or Admin role
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "founder" && user.role !== "admin") {
    redirect("/forbidden");
  }
  return user;
}

/**
 * Check if user is the protected Founder
 */
export function isFounder(uid: string): boolean {
  return uid === FOUNDER_UID;
}
