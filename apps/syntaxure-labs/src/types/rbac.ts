/**
 * RBAC Types (Stub)
 * ------------------
 * Placeholder for role-based access control types.
 */

export type UserRole = "founder" | "admin" | "partner" | "employee";

export interface Permission {
  resource: string;
  action: string;
}
