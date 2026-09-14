/**
 * Server-side authorization rules for Prism Manage.
 *
 * Prism Manage is a Notion-like internal workspace / productivity system.
 * Its permission model is deliberately small and is enforced with the same
 * philosophy as the client-side guards (ModeGuard, MarketingGuard, RoleGuard):
 *
 *   - `founder` — full access. A founder may optionally carry a C-level
 *     title (ceo/cto/cpo/coo/cmo) that scopes them to their department.
 *   - `employee` — department-scoped access.
 *
 * These pure functions encode the rules so they can be enforced inside
 * server actions / API routes AND unit-tested without a database.
 */

export interface WorkspaceAccess {
  /** Role in the workspace: founder, employee, or null (no membership). */
  role: "founder" | "employee" | null;
  /** C-level refinement (founders only): ceo, cto, cpo, coo, cmo. */
  cLevelTitle: string | null;
  /** Name of the department the user is assigned to (employees). */
  departmentName: string | null;
}

const MARKETING_DEPARTMENT = "Marketing";

/**
 * Whether the user may view and mutate marketing operations data.
 *
 * Mirrors the client-side MarketingGuard / RoleGuard matrices:
 *   - Unrefined founder: allowed (all departments)
 *   - CEO: allowed (all departments)
 *   - CMO: allowed (Marketing is their department)
 *   - Employee assigned to the Marketing department: allowed
 *   - Everyone else (CTO/CPO/COO, other employees, non-members): denied
 */
export function isMarketingAuthorized(access: WorkspaceAccess): boolean {
  if (access.role === "founder") {
    if (!access.cLevelTitle) return true;
    return access.cLevelTitle === "ceo" || access.cLevelTitle === "cmo";
  }
  return access.departmentName === MARKETING_DEPARTMENT;
}

/**
 * Whether the user may move a task into the 'approved' status.
 *
 * Mirrors the existing updateTaskStatus rule:
 *   - Personal tasks (no workspace): the owner manages their own workflow.
 *   - Workspace tasks: only founders may approve; employees may not.
 */
export function canApproveTaskStatus(
  role: "founder" | "employee" | null,
  taskHasWorkspace: boolean,
): boolean {
  if (!taskHasWorkspace) return true;
  return role !== "employee";
}
