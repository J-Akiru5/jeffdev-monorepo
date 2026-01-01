'use server';

/**
 * Invoice Server Actions
 * -----------------------
 * CRUD operations for invoices and payments.
 */

import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { generateInvoiceRef, generatePaymentRef } from '@/lib/ref-generator';
import { sendEmail, invoiceEmailTemplate, BRANDED_SENDER } from '@/lib/email';
import type { Invoice, InvoiceStatus, PaymentRecord } from '@/types/invoice';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================
const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  amount: z.number(),
});

const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientCompany: z.string().optional(),
  clientAddress: z.string().optional(),
  projectSlug: z.string().optional(),
  projectTitle: z.string().optional(),
  items: z.array(lineItemSchema).min(1),
  currency: z.enum(['USD', 'PHP']),
  taxRate: z.number().min(0).max(1).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  sendOnCreate: z.boolean().optional(),
});

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.enum(['paypal', 'gcash', 'bank_transfer', 'cash']),
  transactionId: z.string().optional(),
  proofUrl: z.string().optional(),
  notes: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function calculateInvoiceTotals(
  items: { amount: number }[],
  taxRate?: number,
  discount?: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = taxRate ? subtotal * taxRate : 0;
  const total = subtotal + tax - (discount || 0);
  return { subtotal, tax, total };
}

function determineInvoiceStatus(
  paidAmount: number,
  total: number,
  dueDate: string,
  currentStatus: InvoiceStatus
): InvoiceStatus {
  if (currentStatus === 'draft' || currentStatus === 'cancelled') {
    return currentStatus;
  }
  if (paidAmount >= total) return 'paid';
  if (paidAmount > 0) return 'partial';
  if (new Date(dueDate) < new Date()) return 'overdue';
  return 'sent';
}

// =============================================================================
// GET INVOICES
// =============================================================================
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const snapshot = await db
      .collection('invoices')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];
  } catch (error) {
    console.error('[GET INVOICES ERROR]', error);
    return [];
  }
}

export async function getInvoiceByRefNo(refNo: string): Promise<Invoice | null> {
  try {
    const snapshot = await db
      .collection('invoices')
      .where('refNo', '==', refNo)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as Invoice;
  } catch (error) {
    console.error('[GET INVOICE ERROR]', error);
    return null;
  }
}

// =============================================================================
// CREATE INVOICE
// =============================================================================
export async function createInvoice(data: z.infer<typeof createInvoiceSchema>) {
  try {
    const validated = createInvoiceSchema.parse(data);
    const { subtotal, tax, total } = calculateInvoiceTotals(
      validated.items,
      validated.taxRate,
      validated.discount
    );

    const invoice: Omit<Invoice, 'id'> = {
      refNo: generateInvoiceRef(),
      clientName: validated.clientName,
      clientEmail: validated.clientEmail,
      clientCompany: validated.clientCompany,
      clientAddress: validated.clientAddress,
      projectSlug: validated.projectSlug,
      projectTitle: validated.projectTitle,
      items: validated.items,
      currency: validated.currency,
      subtotal,
      tax,
      taxRate: validated.taxRate,
      discount: validated.discount,
      total,
      paidAmount: 0,
      balanceDue: total,
      status: 'draft',
      issueDate: new Date().toISOString(),
      dueDate: validated.dueDate,
      payments: [],
      notes: validated.notes,
      termsAndConditions: validated.termsAndConditions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('invoices').add(invoice);

    await logAuditEvent({
      action: 'CREATE',
      resource: 'invoices',
      resourceId: docRef.id,
      details: { refNo: invoice.refNo, total, currency: invoice.currency },
    });

    // Handle auto-send if requested
    if (validated.sendOnCreate) {
      await sendInvoice(docRef.id);
    }

    revalidatePath('/admin/invoices');

    return { success: true, id: docRef.id, refNo: invoice.refNo };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[CREATE INVOICE VALIDATION ERROR]', JSON.stringify(error.issues, null, 2));
      const fieldErrors = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${fieldErrors}` };
    }
    console.error('[CREATE INVOICE ERROR]', error);
    return { success: false, error: 'Failed to create invoice' };
  }
}

// =============================================================================
// UPDATE INVOICE (Draft only)
// =============================================================================
export async function updateInvoice(
  id: string,
  data: Partial<z.infer<typeof createInvoiceSchema>>
) {
  try {
    const docRef = db.collection('invoices').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = doc.data() as Invoice;
    if (invoice.status !== 'draft') {
      return { success: false, error: 'Can only edit draft invoices' };
    }

    const validated = createInvoiceSchema.partial().parse(data);
    
    // Recalculate if items changed
    let updates: Partial<Invoice> = { ...validated, updatedAt: new Date().toISOString() };
    
    if (validated.items) {
      const { subtotal, tax, total } = calculateInvoiceTotals(
        validated.items,
        validated.taxRate ?? invoice.taxRate,
        validated.discount ?? invoice.discount
      );
      updates = { ...updates, subtotal, tax, total, balanceDue: total };
    }

    await docRef.update(updates);

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'invoices',
      resourceId: id,
      details: validated,
    });

    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${id}`);

    return { success: true };
  } catch (error) {
    console.error('[UPDATE INVOICE ERROR]', error);
    return { success: false, error: 'Failed to update invoice' };
  }
}

// =============================================================================
// SEND INVOICE
// =============================================================================
export async function sendInvoice(id: string) {
  try {
    const docRef = db.collection('invoices').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = { id: doc.id, ...doc.data() } as Invoice;
    if (invoice.status !== 'draft') {
      return { success: false, error: 'Invoice already sent' };
    }

    // Generate PDF buffer for attachment (dynamic import to avoid module loading issues)
    const { generateInvoicePDFBuffer } = await import('@/lib/invoice-pdf-buffer');
    const pdfBuffer = await generateInvoicePDFBuffer(invoice);

    // Prepare payment link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeffdev.studio';
    const paymentLink = `${baseUrl}/pay/${invoice.refNo}`;

    // Send email with PDF attachment
    await sendEmail({
      to: invoice.clientEmail,
      from: BRANDED_SENDER,
      subject: `Invoice ${invoice.refNo} from JD Studio`,
      html: invoiceEmailTemplate({
        clientName: invoice.clientName,
        refNo: invoice.refNo,
        total: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        paymentLink,
        projectTitle: invoice.projectTitle,
        items: invoice.items.map((item) => ({
          description: item.description,
          amount: item.amount,
        })),
      }),
      attachments: [
        {
          filename: `Invoice-${invoice.refNo}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Update invoice status
    await docRef.update({
      status: 'sent',
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'STATUS_CHANGE',
      resource: 'invoices',
      resourceId: id,
      details: { oldStatus: 'draft', newStatus: 'sent', emailSent: true },
    });

    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${id}`);

    return { success: true };
  } catch (error) {
    console.error('[SEND INVOICE ERROR]', error);
    return { success: false, error: 'Failed to send invoice' };
  }
}

// =============================================================================
// RECORD PAYMENT
// =============================================================================
export async function recordPayment(
  invoiceId: string,
  data: z.infer<typeof paymentSchema>
) {
  try {
    const validated = paymentSchema.parse(data);

    const docRef = db.collection('invoices').doc(invoiceId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = doc.data() as Invoice;
    
    const payment: PaymentRecord = {
      id: generatePaymentRef(),
      amount: validated.amount,
      method: validated.method,
      transactionId: validated.transactionId,
      proofUrl: validated.proofUrl,
      notes: validated.notes,
      status: validated.method === 'gcash' ? 'pending' : 'verified',
      paidAt: new Date().toISOString(),
    };

    const newPaidAmount = invoice.paidAmount + validated.amount;
    const newBalanceDue = invoice.total - newPaidAmount;
    const newStatus = determineInvoiceStatus(
      newPaidAmount,
      invoice.total,
      invoice.dueDate,
      invoice.status
    );

    await docRef.update({
      payments: [...invoice.payments, payment],
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : invoice.paidAt,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'invoices',
      resourceId: invoiceId,
      details: { paymentId: payment.id, amount: validated.amount, method: validated.method },
    });

    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath(`/pay/${invoice.refNo}`);

    return { success: true, paymentId: payment.id };
  } catch (error) {
    console.error('[RECORD PAYMENT ERROR]', error);
    return { success: false, error: 'Failed to record payment' };
  }
}

// =============================================================================
// VERIFY GCASH PAYMENT
// =============================================================================
export async function verifyGcashPayment(
  invoiceId: string,
  paymentId: string,
  verified: boolean
) {
  try {
    const docRef = db.collection('invoices').doc(invoiceId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = doc.data() as Invoice;
    const paymentIndex = invoice.payments.findIndex((p) => p.id === paymentId);

    if (paymentIndex === -1) {
      return { success: false, error: 'Payment not found' };
    }

    const updatedPayments = [...invoice.payments];
    updatedPayments[paymentIndex] = {
      ...updatedPayments[paymentIndex],
      status: verified ? 'verified' : 'rejected',
      verifiedAt: new Date().toISOString(),
    };

    // If rejected, reduce paid amount
    let paidAmount = invoice.paidAmount;
    if (!verified) {
      paidAmount -= invoice.payments[paymentIndex].amount;
    }

    const balanceDue = invoice.total - paidAmount;
    const status = determineInvoiceStatus(
      paidAmount,
      invoice.total,
      invoice.dueDate,
      invoice.status
    );

    await docRef.update({
      payments: updatedPayments,
      paidAmount,
      balanceDue,
      status,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'invoices',
      resourceId: invoiceId,
      details: { paymentId, verified },
    });

    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${invoiceId}`);

    return { success: true };
  } catch (error) {
    console.error('[VERIFY PAYMENT ERROR]', error);
    return { success: false, error: 'Failed to verify payment' };
  }
}

// =============================================================================
// DELETE INVOICE (Draft only)
// =============================================================================
export async function deleteInvoice(id: string) {
  try {
    const docRef = db.collection('invoices').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = doc.data() as Invoice;
    if (invoice.status !== 'draft') {
      return { success: false, error: 'Can only delete draft invoices' };
    }

    await docRef.delete();

    await logAuditEvent({
      action: 'DELETE',
      resource: 'invoices',
      resourceId: id,
    });

    revalidatePath('/admin/invoices');

    return { success: true };
  } catch (error) {
    console.error('[DELETE INVOICE ERROR]', error);
    return { success: false, error: 'Failed to delete invoice' };
  }
}
