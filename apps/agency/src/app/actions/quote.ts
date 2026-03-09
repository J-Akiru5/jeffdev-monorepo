/**
 * Quote Form Server Action
 * -------------------------
 * Handles multi-step quote form submissions:
 * 1. Validates all steps with Zod
 * 2. Saves to Firestore
 * 3. Sends email notification to hire@jeffdev.studio
 */

'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import {
  sendEmail,
  quoteEmailTemplate,
  EMAIL_ADDRESSES,
} from '@/lib/email';
import { generateQuoteRef } from '@/lib/ref-generator';

const quoteSchema = z.object({
  // Step 1: Project Type
  projectType: z.enum(['web', 'saas', 'mobile', 'ai', 'other'], {
    message: 'Please select a project type',
  }),
  
  // Step 2: Budget & Timeline
  budget: z.enum(['50k-100k', '100k-250k', '250k-500k', '500k+'], {
    message: 'Please select a budget range',
  }),
  timeline: z.enum(['1-2-weeks', '1-month', '2-3-months', 'flexible'], {
    message: 'Please select a timeline',
  }),
  
  // Step 3: Contact Info
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  details: z.string().min(20, 'Please provide at least 20 characters of detail'),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

export async function submitQuoteForm(data: QuoteFormData) {
  try {
    // Validate input
    const validated = quoteSchema.parse(data);

    // Generate unique reference number
    const refNo = generateQuoteRef();

    // Save to Firestore
    const docRef = await db.collection('quotes').add({
      ...validated,
      refNo,
      status: 'new',
      closedReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Send email notification
    await sendEmail({
      to: EMAIL_ADDRESSES.hire,
      subject: `🎯 New Quote Request: ${validated.projectType.toUpperCase()} - ${validated.budget}`,
      html: quoteEmailTemplate(validated),
      replyTo: validated.email,
    });

    return {
      success: true,
      message: 'Quote request submitted! We\'ll respond within 24 hours with a custom quote.',
      id: docRef.id,
    };
  } catch (error) {
    console.error('[QUOTE FORM ERROR]', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        errors: error.issues,
      };
    }

    return {
      success: false,
      message: 'Failed to submit quote request. Please try again or contact us directly.',
    };
  }
}

/**
 * Update quote status (admin action)
 */
export async function updateQuoteStatus(
  quoteId: string,
  status: 'new' | 'contacted' | 'in-progress' | 'closed'
) {
  try {
    const { logAuditEvent } = await import('@/lib/audit');

    const docRef = db.collection('quotes').doc(quoteId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Quote not found' };
    }

    const oldStatus = doc.data()?.status;

    await docRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'STATUS_CHANGE',
      resource: 'quotes',
      resourceId: quoteId,
      details: { oldStatus, newStatus: status },
    });

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/quotes');

    return { success: true };
  } catch (error) {
    console.error('[UPDATE QUOTE STATUS ERROR]', error);
    return { success: false, error: 'Failed to update status' };
  }
}

