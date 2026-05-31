/**
 * Mode Permissions
 * ----------------
 * Defines the feature access matrix based on the current mode (focus/workspace)
 * and the user's workspace role (founder/employee).
 *
 * Mode semantics:
 *   - `focus`: Personal productivity — all users see tasks, calendar, kanban
 *   - `workspace`: Organization — role-based access to departments, marketing
 *
 * Permission levels:
 *   - `"allowed"`: feature is available
 *   - `"restricted"`: feature is available but with role-based limitations
 *   - `"hidden"`: feature is not available in this mode
 */

import type { ManageMode } from "@/stores/manage-mode-store";

/** Features that can be guarded by mode+role permissions */
export type ManageFeature =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "kanban"
  | "marketing"
  | "departments"
  | "settings"
  | "profile"
  | "create_task"
  | "delete_task"
  | "manage_members"
  | "manage_departments"
  | "manage_projects";

type PermissionLevel = "allowed" | "restricted" | "hidden";

/**
 * Permission matrix keyed by (mode, role) → feature → level.
 *
 * `founder` and `employee` roles use the same foundational access within each mode.
 * Additional restrictions (C-Level scoping, department assignment) are handled
 * at the component level via existing RoleGuard and MarketingGuard.
 */
const PERMISSION_MATRIX: Record<
  ManageMode,
  Record<string, Record<ManageFeature, PermissionLevel>>
> = {
  focus: {
    founder: {
      dashboard: "allowed",
      tasks: "allowed",
      calendar: "allowed",
      kanban: "allowed",
      marketing: "restricted",   // Only if C-Level or Marketing dept member
      departments: "hidden",
      settings: "allowed",
      profile: "allowed",
      create_task: "allowed",
      delete_task: "allowed",
      manage_members: "hidden",
      manage_departments: "hidden",
      manage_projects: "allowed",
    },
    employee: {
      dashboard: "allowed",
      tasks: "allowed",
      calendar: "allowed",
      kanban: "allowed",
      marketing: "restricted",
      departments: "hidden",
      settings: "allowed",
      profile: "allowed",
      create_task: "allowed",
      delete_task: "restricted", // Employees cannot delete tasks in Focus mode
      manage_members: "hidden",
      manage_departments: "hidden",
      manage_projects: "allowed",
    },
  },
  workspace: {
    founder: {
      dashboard: "allowed",
      tasks: "allowed",
      calendar: "allowed",
      kanban: "allowed",
      marketing: "restricted",
      departments: "allowed",    // All departments visible to founders
      settings: "allowed",
      profile: "allowed",
      create_task: "allowed",
      delete_task: "allowed",
      manage_members: "allowed", // Founder can manage members in Workspace mode
      manage_departments: "allowed",
      manage_projects: "allowed",
    },
    employee: {
      dashboard: "allowed",
      tasks: "allowed",
      calendar: "allowed",
      kanban: "allowed",
      marketing: "restricted",
      departments: "restricted", // Only assigned department visible
      settings: "allowed",
      profile: "allowed",
      create_task: "allowed",
      delete_task: "restricted",
      manage_members: "hidden",  // Employees cannot manage members
      manage_departments: "hidden",
      manage_projects: "allowed",
    },
  },
};

/**
 * Check if a feature is accessible in the current mode + role combination.
 *
 * Returns:
 *   - `true` – feature is fully allowed
 *   - `false` – feature is hidden or the caller explicitly wants to check only for "allowed"
 */
export function canAccessFeature(
  mode: ManageMode,
  role: "founder" | "employee" | null,
  feature: ManageFeature,
  requireExplicitAllowed = false,
): boolean {
  const resolvedRole = role || "employee";
  const level = PERMISSION_MATRIX[mode]?.[resolvedRole]?.[feature];

  if (requireExplicitAllowed) {
    return level === "allowed";
  }

  return level === "allowed" || level === "restricted";
}

/**
 * Get the permission level for a feature in the current mode + role.
 * Useful when a component needs to distinguish "allowed" vs "restricted".
 */
export function getFeatureLevel(
  mode: ManageMode,
  role: "founder" | "employee" | null,
  feature: ManageFeature,
): PermissionLevel {
  const resolvedRole = role || "employee";
  return PERMISSION_MATRIX[mode]?.[resolvedRole]?.[feature] ?? "hidden";
}

/**
 * Check if a feature should be hidden (not just restricted).
 * Hidden features should not be shown in navigation or accessible via URL.
 */
export function isFeatureHidden(
  mode: ManageMode,
  role: "founder" | "employee" | null,
  feature: ManageFeature,
): boolean {
  const resolvedRole = role || "employee";
  return (PERMISSION_MATRIX[mode]?.[resolvedRole]?.[feature]) === "hidden";
}


