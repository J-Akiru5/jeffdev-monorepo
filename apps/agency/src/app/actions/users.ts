'use server';

/**
 * User Profile Server Actions
 * ---------------------------
 * CRUD operations for user profiles.
 */

import { db } from '@/lib/firebase/admin';
import type { UserProfile, PublicNamecard } from '@/types/user';
import { logAuditEvent } from '@/lib/audit';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { sanitizeFirestoreData } from '@/lib/utils';
// ... existing imports ...



const COLLECTION = 'users';

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const doc = await db.collection(COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() } as UserProfile;
  } catch (error) {
    console.error('[GET USER PROFILE ERROR]', error);
    return null;
  }
}

/**
 * Get public namecard by username
 */
export async function getPublicNamecard(username: string): Promise<PublicNamecard | null> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('namecard.username', '==', username)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const user = snapshot.docs[0].data() as UserProfile;
    
    // Build public namecard (only expose allowed fields)
    const namecard: PublicNamecard = {
      username: user.namecard!.username,
      displayName: user.displayName,
      title: user.title,
      tagline: user.namecard?.tagline,
      photoURL: user.photoURL,
      bio: user.bio,
      email: user.namecard?.showEmail ? user.email : undefined,
      phone: user.namecard?.showPhone ? user.phone : undefined,
      // Filter social links based on visibility settings
      social: {
        linkedin: user.namecard?.socials?.linkedin ? user.social?.linkedin : undefined,
        github: user.namecard?.socials?.github ? user.social?.github : undefined,
        twitter: user.namecard?.socials?.twitter ? user.social?.twitter : undefined,
        website: user.namecard?.socials?.website ? user.social?.website : undefined,
      },
      accentColor: user.namecard?.accentColor,
      background: user.namecard?.background,
    };

    return namecard;
  } catch (error) {
    console.error('[GET PUBLIC NAMECARD ERROR]', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove protected fields (prefixed with _ to indicate intentional exclusion)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role: _role, status: _status, createdAt: _createdAt, ...safeData } = data;

    await db.collection(COLLECTION).doc(uid).update({
      ...safeData,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: uid,
      details: { fields: Object.keys(safeData) },
    });

    return { success: true };
  } catch (error) {
    console.error('[UPDATE USER PROFILE ERROR]', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Check if namecard username is available
 */
export async function checkUsernameAvailable(
  username: string,
  excludeUid?: string
): Promise<boolean> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('namecard.username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) return true;
    if (excludeUid && snapshot.docs[0].id === excludeUid) return true;
    return false;
  } catch (error) {
    console.error('[CHECK USERNAME ERROR]', error);
    return false;
  }
}

/**
 * Get all users (for admin user management)
 * Serializes Firestore Timestamps to ISO strings for client components
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return sanitizeFirestoreData<UserProfile>({
        uid: doc.id, 
        ...data
      });
    });
  } catch (error) {
    console.error('[GET ALL USERS ERROR]', error);
    return [];
  }
}

