'use server';

/**
 * User Profile Server Actions
 * ---------------------------
 * CRUD operations for user profiles.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { UserProfile, PublicNamecard } from '@/types/user';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeFirestoreData } from '@/lib/utils';
// ... existing imports ...



const COLLECTION = 'user_profiles';

/**
 * Get user profile by ID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from(COLLECTION)
      .select('*')
      .eq('id', uid)
      .single();

    if (error || !data) return null;
    return { uid: data.id, ...data } as UserProfile;
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
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from(COLLECTION)
      .select('*')
      .eq('namecard.username', username)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error || !data) return null;

    const user = data as UserProfile;
    
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
    const { role: _role, status: _status, created_at: _createdAt, ...safeData } = data;

    const supabase = getAdminClient();
    const { error } = await supabase
      .from(COLLECTION)
      .update({
        ...safeData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', uid);

    if (error) throw error;

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
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from(COLLECTION)
      .select('id')
      .eq('namecard.username', username)
      .limit(1);

    if (error || !data || data.length === 0) return true;
    if (excludeUid && data[0].id === excludeUid) return true;
    return false;
  } catch (error) {
    console.error('[CHECK USERNAME ERROR]', error);
    return false;
  }
}

/**
 * Get all users (for admin user management)
 * Supabase already returns ISO strings, no serialization needed
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from(COLLECTION)
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((doc) => ({
      uid: doc.id, 
      ...doc
    })) as UserProfile[];
  } catch (error) {
    console.error('[GET ALL USERS ERROR]', error);
    return [];
  }
}