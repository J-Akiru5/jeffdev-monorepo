'use server';

/**
 * User Invite Server Actions
 * --------------------------
 * Magic link invite system for onboarding team members.
 * Flow: Create invite → Send email → User clicks link → Complete signup
 */

import { db, adminAuth } from '@/lib/firebase/admin';
import type { UserRole } from '@/types/rbac';
import type { UserInvite } from '@/types/user';
import { logAuditEvent } from '@/lib/audit';
import { randomBytes } from 'crypto';
import { sendEmail, inviteEmailTemplate, BRANDED_SENDER } from '@/lib/email';
import { sanitizeFirestoreData } from '@/lib/utils';

const COLLECTION = 'invites';
const USERS_COLLECTION = 'users';

// Founder UID - locked to single account
const FOUNDER_UID = process.env.FOUNDER_UID || 'founder-001';

// Base URL for invite links
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeffdev.studio';

/**
 * Generate a secure invite token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new invite (Founder/Admin only)
 * Automatically sends invite email via Resend
 */
export async function createInvite(
  data: {
    email: string;
    role: UserRole;
    invitedBy: string;
    projectId?: string;  // Optional project assignment
    projectName?: string;
  }
): Promise<{ success: boolean; inviteId?: string; token?: string; error?: string }> {
  try {
    // Validate role (prevent creating Founder invites)
    if (data.role === 'founder') {
      return { success: false, error: 'Cannot create founder invites' };
    }

    // Check if user already exists
    const existingUser = await db
      .collection(USERS_COLLECTION)
      .where('email', '==', data.email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Check for pending invite
    const existingInvite = await db
      .collection(COLLECTION)
      .where('email', '==', data.email)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingInvite.empty) {
      return { success: false, error: 'Pending invite already exists for this email' };
    }

    // Get inviter's name for the email
    let inviterName: string | undefined;
    const inviterDoc = await db.collection(USERS_COLLECTION).doc(data.invitedBy).get();
    if (inviterDoc.exists) {
      inviterName = inviterDoc.data()?.displayName;
    }

    // Create invite
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invite: Omit<UserInvite, 'id'> = {
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
      status: 'pending',
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      ...(data.projectId && { projectId: data.projectId }),
      ...(data.projectName && { projectName: data.projectName }),
    };

    const docRef = await db.collection(COLLECTION).add(invite);

    // Send invite email via Resend
    const inviteLink = `${BASE_URL}/auth/invite/${token}`;

    try {
      await sendEmail({
        to: data.email,
        from: BRANDED_SENDER,
        subject: `You're invited to join JD Studio as ${data.role}`,
        html: inviteEmailTemplate({
          email: data.email,
          role: data.role,
          inviteLink,
          inviterName,
          projectName: data.projectName,
          expiresAt: expiresAt.toISOString(),
        }),
      });
    } catch (emailError) {
      console.error('[INVITE EMAIL SEND ERROR]', emailError);
      // Don't fail the invite creation, just log the error
      // The invite is still valid, admin can resend
    }

    await logAuditEvent({
      action: 'CREATE',
      resource: 'users',
      resourceId: docRef.id,
      details: {
        email: data.email,
        role: data.role,
        type: 'invite',
        projectId: data.projectId,
        emailSent: true,
      },
    });

    return { success: true, inviteId: docRef.id, token };
  } catch (error) {
    console.error('[CREATE INVITE ERROR]', error);
    return { success: false, error: 'Failed to create invite' };
  }
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string): Promise<UserInvite | null> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('token', '==', token)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const invite = { id: doc.id, ...doc.data() } as UserInvite;

    // Check if expired
    if (new Date(invite.expiresAt) < new Date()) {
      await doc.ref.update({ status: 'expired' });
      return null;
    }

    return invite;
  } catch (error) {
    console.error('[GET INVITE BY TOKEN ERROR]', error);
    return null;
  }
}

/**
 * Complete invite (after magic link authentication)
 */
export async function completeInvite(
  token: string,
  uid: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invite = await getInviteByToken(token);
    if (!invite) {
      return { success: false, error: 'Invalid or expired invite' };
    }

    // Create user profile in Firestore
    const userProfile = {
      uid,
      email: invite.email,
      displayName,
      role: invite.role,
      status: 'active',
      assignedProjects: [],
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(USERS_COLLECTION).doc(uid).set(userProfile);

    // Set custom claims for role
    await adminAuth.setCustomUserClaims(uid, { role: invite.role });

    // Mark invite as accepted
    await db.collection(COLLECTION).doc(invite.id!).update({
      status: 'accepted',
    });

    await logAuditEvent({
      action: 'CREATE',
      resource: 'users',
      resourceId: uid,
      details: { email: invite.email, role: invite.role, type: 'signup_complete' },
    });

    return { success: true };
  } catch (error) {
    console.error('[COMPLETE INVITE ERROR]', error);
    return { success: false, error: 'Failed to complete signup' };
  }
}

/**
 * Get all invites
 */
export async function getInvites(): Promise<UserInvite[]> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return sanitizeFirestoreData<UserInvite>({
        id: doc.id, 
        ...data
      });
    });
  } catch (error) {
    console.error('[GET INVITES ERROR]', error);
    return [];
  }
}

/**
 * Revoke an invite
 */
export async function revokeInvite(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection(COLLECTION).doc(inviteId).update({
      status: 'expired',
    });

    await logAuditEvent({
      action: 'DELETE',
      resource: 'users',
      resourceId: inviteId,
      details: { type: 'invite_revoked' },
    });

    return { success: true };
  } catch (error) {
    console.error('[REVOKE INVITE ERROR]', error);
    return { success: false, error: 'Failed to revoke invite' };
  }
}

/**
 * Resend invite with new token and extended expiry
 */
export async function resendInvite(
  inviteId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const inviteRef = db.collection(COLLECTION).doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      return { success: false, error: 'Invite not found' };
    }

    const invite = inviteDoc.data() as UserInvite;

    // Can only resend pending invites
    if (invite.status !== 'pending') {
      return { success: false, error: 'Can only resend pending invites' };
    }

    // Generate new token and extend expiry
    const newToken = generateInviteToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await inviteRef.update({
      token: newToken,
      expiresAt: newExpiresAt.toISOString(),
    });

    // Send new invite email
    const inviteLink = `${BASE_URL}/auth/invite/${newToken}`;

    try {
      await sendEmail({
        to: invite.email,
        from: BRANDED_SENDER,
        subject: `Action Required: Accept Your Invitation to JD Studio`,
        html: inviteEmailTemplate({
          email: invite.email,
          role: invite.role,
          inviteLink,
          projectName: invite.projectName,
          expiresAt: newExpiresAt.toISOString(),
        }),
      });
    } catch (emailError) {
      console.error('[RESEND INVITE EMAIL ERROR]', emailError);
    }

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: inviteId,
      details: { type: 'invite_resent', email: invite.email },
    });

    return { success: true, token: newToken };
  } catch (error) {
    console.error('[RESEND INVITE ERROR]', error);
    return { success: false, error: 'Failed to resend invite' };
  }
}

/**
 * Update user role (with Founder protection)
 */
export async function updateUserRole(
  uid: string,
  newRole: UserRole,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Founder protection: Cannot change Founder's role
    if (uid === FOUNDER_UID) {
      return { success: false, error: 'Cannot modify Founder account' };
    }

    // Cannot promote to Founder
    if (newRole === 'founder') {
      return { success: false, error: 'Cannot promote to Founder role' };
    }

    await db.collection(USERS_COLLECTION).doc(uid).update({
      role: newRole,
      updatedAt: new Date().toISOString(),
    });

    // Update custom claims
    await adminAuth.setCustomUserClaims(uid, { role: newRole });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: uid,
      details: { newRole, updatedBy },
    });

    return { success: true };
  } catch (error) {
    console.error('[UPDATE USER ROLE ERROR]', error);
    return { success: false, error: 'Failed to update role' };
  }
}

/**
 * Assign projects to a Partner/Employee
 */
export async function assignProjects(
  uid: string,
  projectSlugs: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Founder protection
    if (uid === FOUNDER_UID) {
      return { success: false, error: 'Cannot modify Founder account' };
    }

    await db.collection(USERS_COLLECTION).doc(uid).update({
      assignedProjects: projectSlugs,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: uid,
      details: { assignedProjects: projectSlugs },
    });

    return { success: true };
  } catch (error) {
    console.error('[ASSIGN PROJECTS ERROR]', error);
    return { success: false, error: 'Failed to assign projects' };
  }
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Founder protection
    if (uid === FOUNDER_UID) {
      return { success: false, error: 'Cannot deactivate Founder account' };
    }

    await db.collection(USERS_COLLECTION).doc(uid).update({
      status: 'inactive',
      updatedAt: new Date().toISOString(),
    });

    // Disable in Firebase Auth
    await adminAuth.updateUser(uid, { disabled: true });

    await logAuditEvent({
      action: 'DELETE',
      resource: 'users',
      resourceId: uid,
      details: { type: 'deactivated' },
    });

    return { success: true };
  } catch (error) {
    console.error('[DEACTIVATE USER ERROR]', error);
    return { success: false, error: 'Failed to deactivate user' };
  }
}
