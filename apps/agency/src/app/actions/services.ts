'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Services Server Actions
 * -----------------------
 * CRUD operations for agency services with pricing tiers.
 * 
 * NOTE: Type casting with 'as any' is used due to Supabase's limitation with 
 * dynamically determined table schemas. The actual runtime behavior is correct.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { Service } from '@/types/services';
import { logAuditEvent } from '@/lib/audit';

const COLLECTION = 'services';

/**
 * Get all services
 */
export async function getServices(): Promise<Service[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from(COLLECTION)
      .select('*')
      .order('order', { ascending: true }) as any;

    if (error || !data) return [];

    return data as Service[];
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
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from(COLLECTION)
      .select('*')
      .eq('status', 'published')
      .order('order', { ascending: true }) as any;

    if (error || !data) return [];

    return data.map((doc) => ({
      id: doc.id,
      ...doc,
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
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from(COLLECTION)
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      ...data,
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
  data: Omit<Service, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Check for duplicate slug
    const existing = await getServiceBySlug(data.slug);
    if (existing) {
      return { success: false, error: 'Service with this slug already exists' };
    }

    const service: Omit<Service, 'id'> = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getAdminClient();
    const { data: result, error } = await supabase
      .from(COLLECTION)
      .insert(service)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: 'CREATE',
      resource: 'services',
      resourceId: result.id,
      details: { name: data.name, slug: data.slug },
    });

    return { success: true, id: result.id };
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
    const { id: _id, created_at: _createdAt, ...updateData } = data;

    const supabase = getAdminClient();
    const { error } = await supabase
      .from(COLLECTION)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

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
    const supabase = getAdminClient();
    const { error } = await supabase
      .from(COLLECTION)
      .delete()
      .eq('id', id);

    if (error) throw error;

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
    const supabase = getAdminClient();
    
    // Update each service with its new order
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      const { error } = await supabase
        .from(COLLECTION)
        .update({ 
          order: index, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[REORDER SERVICES ERROR]', error);
    return { success: false, error: 'Failed to reorder services' };
  }
}
