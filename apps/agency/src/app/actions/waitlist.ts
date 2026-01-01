'use server';

/**
 * Waitlist Actions
 * -----------------
 * Server actions for Prism Engine waitlist management.
 */

import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';
import { prismWaitlistConfirmation, prismWaitlistNotification } from '@/lib/emails/prism-emails';

// Updated schema: Role is completely optional now, email is required.
const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role: z.string().optional().default('unknown'),
});

export type WaitlistRole = z.infer<typeof waitlistSchema>['role'];

export interface WaitlistEntry {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  source: string;
}

/**
 * Add an email to the Prism Engine waitlist.
 */
export async function joinWaitlist(data: {
  email: string;
  role?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = waitlistSchema.parse(data);

    // Check if email already exists
    const existing = await db
      .collection('prism_waitlist')
      .where('email', '==', validated.email)
      .get();

    if (!existing.empty) {
      return { success: false, error: 'You\'re already on the waitlist!' };
    }

    // Add to waitlist
    await db.collection('prism_waitlist').add({
      email: validated.email,
      role: validated.role,
      createdAt: new Date().toISOString(),
      source: 'website',
      status: 'approved', // Auto-approve
      emailSent: true,
    });

    // Send confirmation to user
    await sendEmail({
      to: validated.email,
      subject: 'Transmission Received: Prism Engine',
      html: prismWaitlistConfirmation,
    });

    // Send notification to admin (Jeff)
    await sendEmail({
      to: 'jeffmartinez@jeffdev.studio',
      subject: `[Prism] New Waitlist: ${validated.email}`,
      html: prismWaitlistNotification({ 
        email: validated.email, 
        role: validated.role,
        source: 'website' 
      }),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // ZodError.issues is the standard property
      const message = error.issues?.[0]?.message || 'Invalid input';
      return { success: false, error: message };
    }
    console.error('[JOIN WAITLIST ERROR]', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Get all waitlist entries (admin only).
 */
export async function getWaitlistEntries(): Promise<WaitlistEntry[]> {
  try {
    const snapshot = await db
      .collection('prism_waitlist')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WaitlistEntry[];
  } catch (error) {
    console.error('[GET WAITLIST ERROR]', error);
    return [];
  }
}
