'use server';

/**
 * Notification Server Actions
 * ---------------------------
 * Server-side operations for managing user notifications.
 */

import { db } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Notification, NotificationCreateInput } from '@/types/notification';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  limit = 20
): Promise<Notification[]> {
  try {
    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get();

    return snapshot.data().count;
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
      read: true,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to mark as read:', error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  userId: string
): Promise<{ success: boolean }> {
  try {
    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return { success: false };
  }
}

/**
 * Dismiss (delete) a notification
 */
export async function dismissNotification(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).delete();
    return { success: true };
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
    return { success: false };
  }
}

/**
 * Create a new notification
 * This is typically called from other server actions when events occur.
 */
export async function createNotification(
  input: NotificationCreateInput
): Promise<{ success: boolean; id?: string }> {
  try {
    const docRef = await db.collection(NOTIFICATIONS_COLLECTION).add({
      ...input,
      read: false,
      createdAt: Timestamp.now(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Failed to create notification:', error);
    return { success: false };
  }
}
