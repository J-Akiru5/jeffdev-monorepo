"use server";

/**
 * Invoice Server Actions
 * -----------------------
 * CRUD operations for invoices and payments in Supabase.
 * Uses the `invoices` table with payments stored in `metadata` JSONB.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { generateInvoiceRef, generatePaymentRef } from "@/lib/ref-generator";
import { sendEmail, invoiceEmailTemplate, BRANDED_SENDER } from "@/lib/email";
import type { Invoice, InvoiceStatus, PaymentRecord } from "@/types/invoice";

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
  currency: z.enum(["USD", "PHP"]),
  taxRate: z.number().min(0).max(1).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  sendOnCreate: z.boolean().optional(),
});

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.enum(["paypal", "gcash", "bank_transfer", "cash"]),
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
  discount?: number,
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
  currentStatus: InvoiceStatus,
): InvoiceStatus {
  if (currentStatus === "draft" || currentStatus === "cancelled") {
    return currentStatus;
  }
  if (paidAmount >= total) return "paid";
  if (paidAmount > 0) {
    // Partial payment — 'partial' not in DB CHECK constraint.
    // The UI detects partial from metadata.paidAmount instead.
    if (new Date(dueDate) < new Date()) return "overdue";
    return "sent";
  }
  if (new Date(dueDate) < new Date()) return "overdue";
  return "sent";
}

// =============================================================================
// GET INVOICES
// =============================================================================
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => normalizeInvoiceRow(row));
  } catch (error) {
    console.error("[GET INVOICES ERROR]", error);
    return [];
  }
}

export async function getInvoiceByRefNo(
  refNo: string,
): Promise<Invoice | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("invoice_number", refNo)
      .maybeSingle();

    if (error || !data) return null;

    return normalizeInvoiceRow(data);
  } catch (error) {
    console.error("[GET INVOICE ERROR]", error);
    return null;
  }
}

/**
 * Convert Supabase invoice row to the Invoice type expected by the app
 */
function normalizeInvoiceRow(row: Record<string, unknown>): Invoice {
  const metadata = (row.metadata || {}) as Record<string, unknown>;
  const payments = (metadata.payments || []) as PaymentRecord[];

  return {
    id: row.id as string,
    refNo: row.invoice_number as string,
    clientName: (metadata.clientName as string) || "",
    clientEmail: (metadata.clientEmail as string) || "",
    clientCompany: metadata.clientCompany as string | undefined,
    clientAddress: metadata.clientAddress as string | undefined,
    projectSlug: metadata.projectSlug as string | undefined,
    projectTitle: metadata.projectTitle as string | undefined,
    items: (row.line_items as Invoice["items"]) || [],
    currency: (metadata.currency as Invoice["currency"]) || "USD",
    subtotal: parseFloat(row.amount as string) || 0,
    tax: parseFloat(row.tax_amount as string) || 0,
    taxRate: metadata.taxRate as number | undefined,
    discount: metadata.discount as number | undefined,
    total: parseFloat(row.total_amount as string) || 0,
    paidAmount: (metadata.paidAmount as number) || 0,
    balanceDue:
      parseFloat(row.total_amount as string) -
      ((metadata.paidAmount as number) || 0),
    status: row.status as InvoiceStatus,
    issueDate: row.issued_date as string,
    dueDate: row.due_date as string,
    sentAt: metadata.sentAt as string | undefined,
    paidAt: row.paid_date as string | undefined,
    payments,
    notes: row.notes as string | undefined,
    termsAndConditions: row.payment_terms as string | undefined,
    createdBy: metadata.createdBy as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
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
      validated.discount,
    );

    const refNo = generateInvoiceRef(); // Get authenticated user ID
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: result, error } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        amount: subtotal.toString(),
        tax_amount: tax.toString(),
        total_amount: total.toString(),
        status: "draft",
        issued_date: new Date().toISOString().split("T")[0]!,
        due_date: validated.dueDate,
        line_items: validated.items as unknown as Record<string, unknown>[],
        notes: validated.notes || null,
        payment_terms: validated.termsAndConditions || null,
        metadata: {
          clientName: validated.clientName,
          clientEmail: validated.clientEmail,
          clientCompany: validated.clientCompany,
          clientAddress: validated.clientAddress,
          projectSlug: validated.projectSlug,
          projectTitle: validated.projectTitle,
          currency: validated.currency,
          taxRate: validated.taxRate,
          discount: validated.discount,
          paidAmount: 0,
          payments: [],
          sentAt: null,
          createdBy: null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: "CREATE",
      resource: "invoices",
      resourceId: result.id,
      details: { refNo, total, currency: validated.currency },
    });

    // Handle auto-send if requested
    if (validated.sendOnCreate) {
      await sendInvoice(result.id);
    }

    revalidatePath("/admin/invoices");

    return { success: true, id: result.id, refNo };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "[CREATE INVOICE VALIDATION ERROR]",
        JSON.stringify(error.issues, null, 2),
      );
      const fieldErrors = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return { success: false, error: `Validation failed: ${fieldErrors}` };
    }
    console.error("[CREATE INVOICE ERROR]", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

// =============================================================================
// UPDATE INVOICE (Draft only)
// =============================================================================
export async function updateInvoice(
  id: string,
  data: Partial<z.infer<typeof createInvoiceSchema>>,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Invoice not found" };
    }

    if (existing.status !== "draft") {
      return { success: false, error: "Can only edit draft invoices" };
    }

    const validated = createInvoiceSchema.partial().parse(data);
    const existingMetadata = (existing.metadata || {}) as Record<
      string,
      unknown
    >;
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map fields
    if (validated.notes !== undefined) updates.notes = validated.notes;
    if (validated.termsAndConditions !== undefined)
      updates.payment_terms = validated.termsAndConditions;
    if (validated.dueDate) updates.due_date = validated.dueDate;
    if (validated.items) {
      updates.line_items = validated.items as unknown as Record<
        string,
        unknown
      >[];
      const { subtotal, tax, total } = calculateInvoiceTotals(
        validated.items,
        validated.taxRate ?? (existingMetadata.taxRate as number),
        validated.discount ?? (existingMetadata.discount as number),
      );
      updates.amount = subtotal.toString();
      updates.tax_amount = tax.toString();
      updates.total_amount = total.toString();
    }

    // Update metadata
    updates.metadata = {
      ...existingMetadata,
      ...(validated.clientName && { clientName: validated.clientName }),
      ...(validated.clientEmail && { clientEmail: validated.clientEmail }),
      ...(validated.clientCompany !== undefined && {
        clientCompany: validated.clientCompany,
      }),
      ...(validated.clientAddress !== undefined && {
        clientAddress: validated.clientAddress,
      }),
      ...(validated.projectSlug !== undefined && {
        projectSlug: validated.projectSlug,
      }),
      ...(validated.projectTitle !== undefined && {
        projectTitle: validated.projectTitle,
      }),
      ...(validated.currency && { currency: validated.currency }),
      ...(validated.taxRate !== undefined && { taxRate: validated.taxRate }),
      ...(validated.discount !== undefined && { discount: validated.discount }),
    };

    const { error } = await supabase
      .from("invoices")
          .update(updates)
      .eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "invoices",
      resourceId: id,
      details: validated as Record<string, unknown>,
    });

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE INVOICE ERROR]", error);
    return { success: false, error: "Failed to update invoice" };
  }
}

// =============================================================================
// SEND INVOICE
// =============================================================================
export async function sendInvoice(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Invoice not found" };
    }

    if (existing.status !== "draft") {
      return { success: false, error: "Invoice already sent" };
    }

    const invoice = normalizeInvoiceRow(existing);

    // Generate PDF buffer for attachment
    const { generateInvoicePDFBuffer } =
      await import("@/lib/invoice-pdf-buffer");
    const pdfBuffer = await generateInvoicePDFBuffer(invoice);

    // Prepare payment link
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.syntaxure.dev";
    const paymentLink = `${baseUrl}/pay/${invoice.refNo}`;

    // Send email with PDF attachment
    await sendEmail({
      to: invoice.clientEmail,
      from: BRANDED_SENDER,
      subject: `Invoice ${invoice.refNo} from Syntaxure Labs`,
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
    const metadata = (existing.metadata || {}) as Record<string, unknown>;
    metadata.sentAt = new Date().toISOString();

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "STATUS_CHANGE",
      resource: "invoices",
      resourceId: id,
      details: { oldStatus: "draft", newStatus: "sent", emailSent: true },
    });

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[SEND INVOICE ERROR]", error);
    return { success: false, error: "Failed to send invoice" };
  }
}

// =============================================================================
// RECORD PAYMENT
// =============================================================================
export async function recordPayment(
  invoiceId: string,
  data: z.infer<typeof paymentSchema>,
) {
  try {
    const validated = paymentSchema.parse(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Invoice not found" };
    }

    const metadata = (existing.metadata || {}) as Record<string, unknown>;
    const payments = (metadata.payments || []) as PaymentRecord[];
    const currentPaidAmount = (metadata.paidAmount as number) || 0;
    const total = parseFloat(existing.total_amount as string) || 0;

    const payment: PaymentRecord = {
      id: generatePaymentRef(),
      amount: validated.amount,
      method: validated.method,
      transactionId: validated.transactionId,
      proofUrl: validated.proofUrl,
      notes: validated.notes,
      status: validated.method === "gcash" ? "pending" : "verified",
      paidAt: new Date().toISOString(),
    };

    const newPaidAmount = currentPaidAmount + validated.amount;
    const newStatus = determineInvoiceStatus(
      newPaidAmount,
      total,
      existing.due_date as string,
      existing.status as InvoiceStatus,
    );

    metadata.payments = [...payments, payment];
    metadata.paidAmount = newPaidAmount;

    const updates: Record<string, unknown> = {
      metadata,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "paid") {
      updates.paid_date = new Date().toISOString().split("T")[0]!;
    }

    const { error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", invoiceId);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "invoices",
      resourceId: invoiceId,
      details: {
        paymentId: payment.id,
        amount: validated.amount,
        method: validated.method,
      },
    });

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${invoiceId}`);
    revalidatePath(`/pay/${existing.invoice_number}`);

    return { success: true, paymentId: payment.id };
  } catch (error) {
    console.error("[RECORD PAYMENT ERROR]", error);
    return { success: false, error: "Failed to record payment" };
  }
}

// =============================================================================
// VERIFY GCASH PAYMENT
// =============================================================================
export async function verifyGcashPayment(
  invoiceId: string,
  paymentId: string,
  verified: boolean,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Invoice not found" };
    }

    const metadata = (existing.metadata || {}) as Record<string, unknown>;
    const payments = (metadata.payments || []) as PaymentRecord[];
    const paymentIndex = payments.findIndex((p) => p.id === paymentId);

    if (paymentIndex === -1) {
      return { success: false, error: "Payment not found" };
    }

    const updatedPayments = [...payments];
    updatedPayments[paymentIndex] = {
      ...updatedPayments[paymentIndex]!,
      status: verified ? "verified" : "rejected",
      verifiedAt: new Date().toISOString(),
    };

    const total = parseFloat(existing.total_amount as string) || 0;
    let paidAmount = (metadata.paidAmount as number) || 0;
    if (!verified) {
      paidAmount -= payments[paymentIndex]!.amount;
    }

    const status = determineInvoiceStatus(
      paidAmount,
      total,
      existing.due_date as string,
      existing.status as InvoiceStatus,
    );

    metadata.payments = updatedPayments;
    metadata.paidAmount = paidAmount;

    const updates: Record<string, unknown> = {
      metadata,
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "paid") {
      updates.paid_date = new Date().toISOString().split("T")[0]!;
    }

    const { error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", invoiceId);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "invoices",
      resourceId: invoiceId,
      details: { paymentId, verified },
    });

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${invoiceId}`);

    return { success: true };
  } catch (error) {
    console.error("[VERIFY PAYMENT ERROR]", error);
    return { success: false, error: "Failed to verify payment" };
  }
}

// =============================================================================
// DELETE INVOICE (Draft only)
// =============================================================================
export async function deleteInvoice(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Invoice not found" };
    }

    if (existing.status !== "draft") {
      return { success: false, error: "Can only delete draft invoices" };
    }

    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "DELETE",
      resource: "invoices",
      resourceId: id,
    });

    revalidatePath("/admin/invoices");

    return { success: true };
  } catch (error) {
    console.error("[DELETE INVOICE ERROR]", error);
    return { success: false, error: "Failed to delete invoice" };
  }
}
