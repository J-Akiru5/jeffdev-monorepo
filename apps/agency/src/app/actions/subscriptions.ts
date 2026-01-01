'use server';

/**
 * Subscription Server Actions
 * ---------------------------
 * Server-side operations for managing service subscriptions.
 */

import { db } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { 
  Subscription, 
  SubscriptionCreateInput, 
  SubscriptionUpdateInput,
  SubscriptionStatus 
} from '@/types/subscription';
import { createNotification } from './notifications';
import { revalidatePath } from 'next/cache';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

/**
 * Get all subscriptions with optional status filter
 */
export async function getSubscriptions(
  status?: SubscriptionStatus
): Promise<Subscription[]> {
  try {
    let query = db.collection(SUBSCRIPTIONS_COLLECTION).orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subscription[];
  } catch (error) {
    console.error('Failed to get subscriptions:', error);
    return [];
  }
}

/**
 * Get a single subscription by ID
 */
export async function getSubscription(id: string): Promise<Subscription | null> {
  try {
    const doc = await db.collection(SUBSCRIPTIONS_COLLECTION).doc(id).get();
    
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    } as Subscription;
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return null;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  input: SubscriptionCreateInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Calculate next billing date based on cycle
    const startDate = new Date(input.startDate);
    const nextBillingDate = new Date(startDate);
    
    switch (input.billingCycle) {
      case 'monthly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
        break;
      case 'yearly':
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        break;
    }

    const docRef = await db.collection(SUBSCRIPTIONS_COLLECTION).add({
      ...input,
      status: 'active',
      currency: input.currency || 'USD',
      startDate: Timestamp.fromDate(startDate),
      nextBillingDate: Timestamp.fromDate(nextBillingDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Create notification for new subscription
    await createNotification({
      userId: 'admin', // TODO: Get admin user ID
      type: 'payment',
      title: 'New Subscription',
      body: `${input.clientName} subscribed to ${input.serviceName} (${input.tier})`,
      link: `/admin/subscriptions/${docRef.id}`,
    });

    revalidatePath('/admin/subscriptions');
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return { success: false, error: 'Failed to create subscription' };
  }
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  id: string,
  input: SubscriptionUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {
      ...input,
      updatedAt: Timestamp.now(),
    };

    // Convert nextBillingDate if provided
    if (input.nextBillingDate) {
      updateData.nextBillingDate = Timestamp.fromDate(new Date(input.nextBillingDate));
    }

    // Handle status changes
    if (input.status === 'cancelled') {
      updateData.cancelledAt = Timestamp.now();
    } else if (input.status === 'paused') {
      updateData.pausedAt = Timestamp.now();
    }

    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(id).update(updateData);

    revalidatePath('/admin/subscriptions');
    return { success: true };
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return { success: false, error: 'Failed to update subscription' };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return updateSubscription(id, { status: 'cancelled' });
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return updateSubscription(id, { status: 'paused' });
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return updateSubscription(id, { status: 'active' });
}

/**
 * Get subscription stats
 */
export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  mrr: number;
}> {
  try {
    const snapshot = await db.collection(SUBSCRIPTIONS_COLLECTION).get();
    
    let total = 0;
    let active = 0;
    let mrr = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      total++;
      
      if (data.status === 'active') {
        active++;
        
        // Calculate MRR based on billing cycle
        switch (data.billingCycle) {
          case 'monthly':
            mrr += data.amount;
            break;
          case 'quarterly':
            mrr += data.amount / 3;
            break;
          case 'yearly':
            mrr += data.amount / 12;
            break;
        }
      }
    });

    return { total, active, mrr: Math.round(mrr * 100) / 100 };
  } catch (error) {
    console.error('Failed to get subscription stats:', error);
    return { total: 0, active: 0, mrr: 0 };
  }
}
