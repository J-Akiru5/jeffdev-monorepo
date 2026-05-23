'use server';

/**
 * Waitlist Actions
 * -----------------
 * Server actions for Prism Context Engine waitlist management.
 */

import { z } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
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
  created_at: string;
  source: string;
}

/**
 * Add an email to the Prism Context Engine waitlist.
 */
export async function joinWaitlist(data: {
  email: string;
  role?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = waitlistSchema.parse(data);

    const supabase = getAdminClient();

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('prism_waitlist')
      .select('id')
      .eq('email', validated.email)
      .limit(1);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) {
      return { success: false, error: 'You\'re already on the waitlist!' };
    }

    // Add to waitlist
    const { error: insertError } = await supabase
      .from('prism_waitlist')
      .insert({
        email: validated.email,
        role: validated.role,
        created_at: new Date().toISOString(),
        source: 'website',
        status: 'approved', // Auto-approve
        email_sent: true,
      });

    if (insertError) throw insertError;

    // Send confirmation to user
    await sendEmail({
      to: validated.email,
      subject: 'Transmission Received: Prism Context Engine',
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
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('prism_waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((doc) => ({
      id: doc.id,
      ...doc,
    })) as WaitlistEntry[];
  } catch (error) {
    console.error('[GET WAITLIST ERROR]', error);
    return [];
  }
}
