/**
 * Access Control Utilities
 * ------------------------
 * Server-side helpers for route protection and permission checks.
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth, db } from '@/lib/firebase/admin';
import type { UserRole, Permission } from '@/types/rbac';
import { rolePermissions } from '@/types/rbac';

// Founder UID - locked to single account
const FOUNDER_UID = process.env.FOUNDER_UID || 'founder-001';

interface SessionUser {
  uid: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  assignedProjects: string[];
}

/**
 * Get current user from session cookie
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) return null;

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // Fetch user profile from Firestore
    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();

    if (!userDoc.exists) {
      // User authenticated but no profile - might be new signup
      return null;
    }

    const userData = userDoc.data()!;

    return {
      uid: decodedClaims.uid,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions || [],
      assignedProjects: userData.assignedProjects || [],
    };
  } catch (error) {
    console.error('[GET CURRENT USER ERROR]', error);
    return null;
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: SessionUser | null, permission: Permission): boolean {
  if (!user) return false;

  // Check explicit permissions first
  if (user.permissions.includes(permission)) return true;

  // Fall back to role defaults
  return rolePermissions[user.role]?.includes(permission) ?? false;
}

/**
 * Check if user can access a project
 */
export function canAccessProject(user: SessionUser | null, projectSlug: string): boolean {
  if (!user) return false;

  // Founder and admin can access all
  if (user.role === 'founder' || user.role === 'admin') return true;

  // Partner/employee only assigned projects
  return user.assignedProjects.includes(projectSlug);
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/admin/login');
  }
  return user;
}

/**
 * Require specific permission - redirect to 403 if not authorized
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasPermission(user, permission)) {
    redirect('/forbidden');
  }
  return user;
}

/**
 * Require Founder or Admin role
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'founder' && user.role !== 'admin') {
    redirect('/forbidden');
  }
  return user;
}

/**
 * Check if user is the protected Founder
 */
export function isFounder(uid: string): boolean {
  return uid === FOUNDER_UID;
}
