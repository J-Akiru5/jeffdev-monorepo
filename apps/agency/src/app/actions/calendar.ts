'use server';

/**
 * Calendar Event Server Actions
 * ------------------------------
 * CRUD operations for calendar events.
 */

import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import type { CalendarEvent, EventType } from '@/types/firestore';

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
    const snapshot = await db
      .collection('calendar_events')
      .orderBy('start', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CalendarEvent[];
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

    const event: Omit<CalendarEvent, 'id'> = {
      ...validated,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('calendar_events').add(event);

    await logAuditEvent({
      action: 'CREATE',
      resource: 'calendar_events',
      resourceId: docRef.id,
      details: { title: validated.title, type: validated.type },
    });

    revalidatePath('/admin/calendar');

    return { success: true, id: docRef.id };
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

    await db.collection('calendar_events').doc(id).update({
      ...validated,
      updatedAt: new Date().toISOString(),
    });

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
    await db.collection('calendar_events').doc(id).delete();

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
