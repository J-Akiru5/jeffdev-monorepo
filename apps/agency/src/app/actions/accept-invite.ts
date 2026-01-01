'use server';

/**
 * Accept Invite Action
 * --------------------
 * Handles the logic for accepting an invite and creating a new user account.
 * Called from the session API route during login/registration.
 */

import { auth, db } from '@/lib/firebase/admin';
import { getInviteByToken } from './invites';
import { Timestamp } from 'firebase-admin/firestore';

interface AcceptInviteResult {
  success: boolean;
  role?: string;
  error?: string;
}

export async function acceptInvite(token: string, uid: string, email: string): Promise<AcceptInviteResult> {
  try {
    // 1. Get and validate invite
    const invite = await getInviteByToken(token);

    if (!invite) {
      return { success: false, error: 'Invalid or expired invite' };
    }

    if (invite.status !== 'pending') {
      return { success: false, error: 'This invite has already been used' };
    }

    // 2. strict email matching
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return { 
        success: false, 
        error: `Email mismatch. This invite is for ${invite.email}, but you signed in with ${email}.` 
      };
    }

    // 3. Create user document
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // User already exists - just update role if needed? 
      // ideally we should probably warn them, but for now let's just update
      // actually, if they already exist, we should probably just error or log them in?
      // but the prompt implies new registration. 
      // Let's assume if they exist, we link the invite to them if they match.
    }

    // Get user display info from Auth
    const userRecord = await auth.getUser(uid);

    const userData = {
      email: userRecord.email,
      displayName: userRecord.displayName || '',
      photoURL: userRecord.photoURL || '',
      role: invite.role,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Add project assignment if present
      assignedProjects: invite.projectId 
        ? [invite.projectId] // In the future this might be an array of slugs
        : [],
      permissions: [], // Default permissions based on role will be used
      metadata: {
        invitedBy: invite.invitedBy,
        inviteId: invite.id,
      }
    };

    await userRef.set(userData, { merge: true });

    // 4. Set custom claims for RBAC
    await auth.setCustomUserClaims(uid, { role: invite.role });

    if (!invite.id) {
      return { success: false, error: 'Invalid invite ID' };
    }

    // 5. Mark invite as used
    await db.collection('invites').doc(invite.id).update({
      status: 'accepted',
      acceptedBy: uid,
      acceptedAt: Timestamp.now(),
    });

    return { success: true, role: invite.role };
  } catch (error) {
    console.error('[ACCEPT INVITE ERROR]', error);
    return { success: false, error: 'Failed to accept invite' };
  }
}
