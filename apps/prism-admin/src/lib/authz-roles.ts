/**
 * Role model for Prism Admin.
 *
 * Hierarchy (top = most privileged):
 *
 *   founder (Super Admin) > admin > manager > employee
 *
 * - `founder` is the canonical Syntaxure Labs Super Admin. Retained from the
 *   existing role model — no new role names were introduced.
 * - `partner` and `employee` are NOT admin roles. They are denied everywhere
 *   in Prism Admin (matching the existing /admin layout gate).
 *
 * This module is deliberately dependency-free (pure) so it can be unit-tested
 * and imported by both `authz.ts` (server IO) and any future client code that
 * only needs to compute role capabilities.
 */

export const ADMIN_ROLES = ["founder", "admin", "manager"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Required-role type used by requireRole() call sites. */
export type RequiredRole = AdminRole;

const ROLE_RANK: Record<string, number> = {
  founder: 3,
  admin: 2,
  manager: 1,
  partner: 0,
  employee: 0,
};

export function roleRank(role: string): number {
  return ROLE_RANK[role] ?? 0;
}

/** True when `role` is at least as privileged as `required`. */
export function canAccess(role: string, required: RequiredRole): boolean {
  return roleRank(role) >= roleRank(required);
}

export const ROLE_HIERARCHY_DESCRIPTION =
  "founder (Super Admin) > admin > manager > employee/partner";

/**
 * Gate logic for development-only privileged endpoints (bootstrap, auth
 * bridge). All three conditions must hold; any failure means "deny".
 *
 * Authorization must never depend solely on NODE_ENV — an explicit opt-in
 * environment flag is required as a second, independent gate.
 */
export function canRunDevOnlyFeature(opts: {
  nodeEnv: string | undefined;
  enabledFlag: string | undefined;
  authenticated: boolean;
}): boolean {
  return (
    opts.nodeEnv === "development" &&
    opts.enabledFlag === "true" &&
    opts.authenticated
  );
}

export class AuthzError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AuthzError";
  }
}
