'use server';

/**
 * Services Server Actions
 * -----------------------
 * CRUD operations for agency services with pricing tiers.
 */

import { db } from '@/lib/firebase/admin';
import type { Service } from '@/types/services';
import { logAuditEvent } from '@/lib/audit';

const COLLECTION = 'services';

/**
 * Get all services
 */
export async function getServices(): Promise<Service[]> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error('[GET SERVICES ERROR]', error);
    return [];
  }
}

/**
 * Get published services only (for public pages)
 */
export async function getPublishedServices(): Promise<Service[]> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('status', '==', 'published')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error('[GET PUBLISHED SERVICES ERROR]', error);
    return [];
  }
}

/**
 * Get service by slug
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as Service;
  } catch (error) {
    console.error('[GET SERVICE BY SLUG ERROR]', error);
    return null;
  }
}

/**
 * Create a new service
 */
export async function createService(
  data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Check for duplicate slug
    const existing = await getServiceBySlug(data.slug);
    if (existing) {
      return { success: false, error: 'Service with this slug already exists' };
    }

    const service: Omit<Service, 'id'> = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(service);

    await logAuditEvent({
      action: 'CREATE',
      resource: 'services',
      resourceId: docRef.id,
      details: { name: data.name, slug: data.slug },
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[CREATE SERVICE ERROR]', error);
    return { success: false, error: 'Failed to create service' };
  }
}

/**
 * Update a service
 */
export async function updateService(
  id: string,
  data: Partial<Service>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove protected fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _createdAt, ...updateData } = data;

    await db.collection(COLLECTION).doc(id).update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'services',
      resourceId: id,
      details: { fields: Object.keys(updateData) },
    });

    return { success: true };
  } catch (error) {
    console.error('[UPDATE SERVICE ERROR]', error);
    return { success: false, error: 'Failed to update service' };
  }
}

/**
 * Delete a service
 */
export async function deleteService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection(COLLECTION).doc(id).delete();

    await logAuditEvent({
      action: 'DELETE',
      resource: 'services',
      resourceId: id,
    });

    return { success: true };
  } catch (error) {
    console.error('[DELETE SERVICE ERROR]', error);
    return { success: false, error: 'Failed to delete service' };
  }
}

/**
 * Reorder services
 */
export async function reorderServices(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const batch = db.batch();

    orderedIds.forEach((id, index) => {
      const ref = db.collection(COLLECTION).doc(id);
      batch.update(ref, { order: index, updatedAt: new Date().toISOString() });
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('[REORDER SERVICES ERROR]', error);
    return { success: false, error: 'Failed to reorder services' };
  }
}
