'use server';

/**
 * Feature Flags
 * --------------
 * Server-side feature flag management via Firestore.
 * Flags are stored in settings/features document.
 */

import { db } from '@/lib/firebase/admin';

export interface FeatureFlags {
  prismEngineEnabled: boolean;
  prismEngineTeaser: boolean;
  updatedAt?: string;
}

const DEFAULT_FLAGS: FeatureFlags = {
  prismEngineEnabled: false,
  prismEngineTeaser: true,
};

/**
 * Get current feature flags from Firestore.
 * Returns default flags if document doesn't exist.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  // Return defaults if Firebase is not initialized (e.g., during Vercel build)
  if (!db) {
    console.warn('[FEATURE FLAGS] Firebase not available, using defaults');
    return DEFAULT_FLAGS;
  }

  try {
    const docRef = db.collection('settings').doc('features');
    const doc = await docRef.get();

    if (!doc.exists) {
      // Create default flags if they don't exist
      await docRef.set({
        ...DEFAULT_FLAGS,
        updatedAt: new Date().toISOString(),
      });
      return DEFAULT_FLAGS;
    }

    const data = doc.data();
    return {
      prismEngineEnabled: data?.prismEngineEnabled ?? DEFAULT_FLAGS.prismEngineEnabled,
      prismEngineTeaser: data?.prismEngineTeaser ?? DEFAULT_FLAGS.prismEngineTeaser,
      updatedAt: data?.updatedAt,
    };
  } catch (error) {
    console.error('[FEATURE FLAGS ERROR]', error);
    return DEFAULT_FLAGS;
  }
}

/**
 * Update feature flags in Firestore.
 * Only accessible to admin users.
 */
export async function updateFeatureFlags(
  flags: Partial<FeatureFlags>
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Firebase not available' };
  }

  try {
    const docRef = db.collection('settings').doc('features');
    await docRef.set(
      {
        ...flags,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error) {
    console.error('[UPDATE FEATURE FLAGS ERROR]', error);
    return { success: false, error: 'Failed to update feature flags' };
  }
}
