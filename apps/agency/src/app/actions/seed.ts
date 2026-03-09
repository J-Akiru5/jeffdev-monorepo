'use server';

/**
 * Seed Actions
 * ------------
 * One-time setup actions for bootstrapping the database.
 * Use with caution - these should only run once.
 */

import { db, adminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Bootstrap the current logged-in user as founder
 * This creates the user document if it doesn't exist
 */
export async function bootstrapCurrentUserAsFounder(
  uid: string,
  email: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user document already exists
    const existingDoc = await db.collection('users').doc(uid).get();
    
    if (existingDoc.exists) {
      // Update existing document to founder role
      await db.collection('users').doc(uid).update({
        role: 'founder',
        updatedAt: Timestamp.now(),
      });
      
      // Set custom claims
      await adminAuth.setCustomUserClaims(uid, { role: 'founder' });
      
      return { success: true };
    }

    // Create new founder document
    const founderProfile = {
      uid,
      email,
      displayName,
      photoURL: '',
      role: 'founder',
      title: 'Founder & Lead Developer',
      bio: 'Building the future, one line at a time',
      phone: '09519167103',
      location: 'Iloilo, Philippines',
      website: 'https://jeffdev.studio',
      status: 'active',
      assignedProjects: [],
      permissions: ['*'],
      socials: {
        github: '',
        linkedin: '',
        twitter: '',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('users').doc(uid).set(founderProfile);
    
    // Set custom claims for role-based access
    await adminAuth.setCustomUserClaims(uid, { role: 'founder' });

    return { success: true };
  } catch (error) {
    console.error('[BOOTSTRAP FOUNDER ERROR]', error);
    return { success: false, error: 'Failed to bootstrap founder account' };
  }
}

/**
 * Update or create user profile
 * This is a more forgiving version that creates if not exists
 */
export async function upsertUserProfile(
  uid: string,
  data: {
    displayName?: string;
    photoURL?: string;
    title?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    socials?: {
      github?: string;
      linkedin?: string;
      twitter?: string;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const existingDoc = await db.collection('users').doc(uid).get();
    
    if (existingDoc.exists) {
      // Update existing
      await db.collection('users').doc(uid).update({
        ...data,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new with defaults
      await db.collection('users').doc(uid).set({
        uid,
        email: '', // Will be filled by auth
        role: 'employee',
        status: 'active',
        assignedProjects: [],
        permissions: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...data,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[UPSERT USER PROFILE ERROR]', error);
    return { success: false, error: 'Failed to update profile' };
  }
}
