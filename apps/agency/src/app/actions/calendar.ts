'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Calendar Event Server Actions
 * ------------------------------
 * CRUD operations for calendar events.
 * 
 * NOTE: Type casting with 'as any' is used due to Supabase's limitation with 
 * dynamically determined table schemas. The actual runtime behavior is correct;
 * TypeScript just cannot infer the response types from `.from('table_name')`.
 */

import { z } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database';

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];

// Validation schema
const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['deadline', 'meeting', 'milestone', 'reminder', 'holiday']),
  start: z.string(),
  end: z.string().optional(),
  allDay: z.boolean().optional(),
  projectSlug: z.string().optional(),
  color: z.string().optional(),
});

/**
 * Get all calendar events
 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true }) as any;

    if (error || !data) return [];

    return data as CalendarEvent[];
  } catch (error) {
    console.error('[GET CALENDAR EVENTS ERROR]', error);
    return [];
  }
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  data: z.infer<typeof eventSchema>
) {
  try {
    const validated = eventSchema.parse(data);

    const event = {
      title: validated.title,
      description: validated.description,
      event_type: validated.type,
      start_time: validated.start,
      end_time: validated.end || validated.start,
      color: validated.color,
      user_id: '', // TODO: Get from session
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getAdminClient();
    const { data: result, error } = await supabase
      .from('calendar_events')
      .insert(event as any)
      .select()
      .single() as any;

    if (error) throw error;

    await logAuditEvent({
      action: 'CREATE',
      resource: 'calendar_events',
      resourceId: result?.id || '',
      details: { title: validated.title, type: validated.type },
    });

    revalidatePath('/admin/calendar');

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('[CREATE CALENDAR EVENT ERROR]', error);
    return { success: false, error: 'Failed to create event' };
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  id: string,
  data: Partial<z.infer<typeof eventSchema>>
) {
  try {
    const validated = eventSchema.partial().parse(data);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validated.title) updateData.title = validated.title;
    if (validated.description) updateData.description = validated.description;
    if (validated.type) updateData.event_type = validated.type;
    if (validated.start) updateData.start_time = validated.start;
    if (validated.end) updateData.end_time = validated.end;
    if (validated.color !== undefined) updateData.color = validated.color;

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id) as any;

    if (error) throw error;

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'calendar_events',
      resourceId: id,
      details: validated,
    });

    revalidatePath('/admin/calendar');

    return { success: true };
  } catch (error) {
    console.error('[UPDATE CALENDAR EVENT ERROR]', error);
    return { success: false, error: 'Failed to update event' };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(id: string) {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAuditEvent({
      action: 'DELETE',
      resource: 'calendar_events',
      resourceId: id,
    });

    revalidatePath('/admin/calendar');

    return { success: true };
  } catch (error) {
    console.error('[DELETE CALENDAR EVENT ERROR]', error);
    return { success: false, error: 'Failed to delete event' };
  }
}
