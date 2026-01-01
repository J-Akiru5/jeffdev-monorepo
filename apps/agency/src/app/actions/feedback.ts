'use server';

/**
 * Feedback Server Actions
 * -----------------------
 * CRUD operations for client testimonials/reviews.
 */

import { db } from '@/lib/firebase/admin';
import type { FirestoreFeedback, FeedbackStatus } from '@/types/firestore';
import { logAuditEvent } from '@/lib/audit';

const COLLECTION = 'feedback';

/**
 * Get all feedback entries
 */
export async function getFeedback(): Promise<FirestoreFeedback[]> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreFeedback[];
  } catch (error) {
    console.error('[GET FEEDBACK ERROR]', error);
    return [];
  }
}

/**
 * Get featured/approved feedback for public display
 */
export async function getPublicFeedback(): Promise<FirestoreFeedback[]> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('status', 'in', ['approved', 'featured'])
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreFeedback[];
  } catch (error) {
    console.error('[GET PUBLIC FEEDBACK ERROR]', error);
    return [];
  }
}

/**
 * Create a new feedback entry
 */
export async function createFeedback(
  data: Omit<FirestoreFeedback, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'featured'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const feedback: Omit<FirestoreFeedback, 'id'> = {
      ...data,
      status: 'pending',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(feedback);

    await logAuditEvent({
      action: 'CREATE',
      resource: 'feedback',
      resourceId: docRef.id,
      details: { clientName: data.clientName },
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[CREATE FEEDBACK ERROR]', error);
    return { success: false, error: 'Failed to create feedback' };
  }
}

/**
 * Update feedback status
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection(COLLECTION).doc(id).update({
      status,
      featured: status === 'featured',
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'STATUS_CHANGE',
      resource: 'feedback',
      resourceId: id,
      details: { status },
    });

    return { success: true };
  } catch (error) {
    console.error('[UPDATE FEEDBACK STATUS ERROR]', error);
    return { success: false, error: 'Failed to update status' };
  }
}

/**
 * Delete feedback
 */
export async function deleteFeedback(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection(COLLECTION).doc(id).delete();

    await logAuditEvent({
      action: 'DELETE',
      resource: 'feedback',
      resourceId: id,
    });

    return { success: true };
  } catch (error) {
    console.error('[DELETE FEEDBACK ERROR]', error);
    return { success: false, error: 'Failed to delete feedback' };
  }
}
