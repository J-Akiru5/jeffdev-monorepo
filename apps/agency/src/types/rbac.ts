/**
 * RBAC Types & Permissions
 * -------------------------
 * Role-based access control for admin panel.
 */

export type UserRole = 'founder' | 'admin' | 'partner' | 'employee';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  assignedProjects: string[]; // Project slugs for partners
  permissions: Permission[];  // Granular overrides
  createdAt: string;
  updatedAt: string;
}

export type Permission =
  | 'dashboard:view'
  | 'dashboard:full'
  | 'projects:view'
  | 'projects:edit'
  | 'projects:delete'
  | 'services:view'
  | 'services:edit'
  | 'services:delete'
  | 'quotes:view'
  | 'quotes:edit'
  | 'messages:view'
  | 'messages:edit'
  | 'feedback:view'
  | 'feedback:edit'
  | 'invoices:view'
  | 'invoices:create'
  | 'invoices:edit'
  | 'subscriptions:view'
  | 'subscriptions:manage'
  | 'users:view'
  | 'users:manage'
  | 'access:manage'
  | 'settings:app'
  | 'settings:profile'
  | 'audit:view'
  | 'calendar:view'
  | 'calendar:edit';

/**
 * Default permissions by role
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  founder: [
    'dashboard:full',
    'projects:view', 'projects:edit', 'projects:delete',
    'services:view', 'services:edit', 'services:delete',
    'quotes:view', 'quotes:edit',
    'messages:view', 'messages:edit',
    'feedback:view', 'feedback:edit',
    'invoices:view', 'invoices:create', 'invoices:edit',
    'subscriptions:view', 'subscriptions:manage',
    'users:view', 'users:manage',
    'access:manage',
    'settings:app', 'settings:profile',
    'audit:view',
    'calendar:view', 'calendar:edit',
  ],
  admin: [
    'dashboard:full',
    'projects:view', 'projects:edit', 'projects:delete',
    'services:view', 'services:edit', 'services:delete',
    'quotes:view', 'quotes:edit',
    'messages:view', 'messages:edit',
    'feedback:view', 'feedback:edit',
    'invoices:view', 'invoices:create', 'invoices:edit',
    'subscriptions:view', 'subscriptions:manage',
    'settings:app', 'settings:profile',
    'audit:view',
    'calendar:view', 'calendar:edit',
  ],
  partner: [
    'dashboard:view',
    'projects:view',
    'quotes:view',
    'feedback:view',
    'invoices:view',
    'settings:profile',
    'calendar:view',
  ],
  employee: [
    'dashboard:view',
    'projects:view',
    'settings:profile',
    'calendar:view',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  user: AppUser | null,
  permission: Permission
): boolean {
  if (!user) return false;
  
  // Check explicit permissions first
  if (user.permissions.includes(permission)) return true;
  
  // Fall back to role defaults
  return rolePermissions[user.role]?.includes(permission) ?? false;
}

/**
 * Check if user can access a specific project
 */
export function canAccessProject(
  user: AppUser | null,
  projectSlug: string
): boolean {
  if (!user) return false;
  
  // Founder and admin can access all
  if (user.role === 'founder' || user.role === 'admin') return true;
  
  // Partner/employee only assigned projects
  return user.assignedProjects.includes(projectSlug);
}

/**
 * Role hierarchy for comparison
 */
export const roleHierarchy: Record<UserRole, number> = {
  founder: 4,
  admin: 3,
  partner: 2,
  employee: 1,
};

/**
 * Check if user A can manage user B
 */
export function canManageUser(manager: AppUser | null, target: AppUser): boolean {
  if (!manager) return false;
  if (manager.uid === target.uid) return false; // Can't manage self
  
  const managerLevel = roleHierarchy[manager.role];
  const targetLevel = roleHierarchy[target.role];
  
  // Founder can manage anyone, others can manage lower roles
  if (manager.role === 'founder') return true;
  return managerLevel > targetLevel;
}
