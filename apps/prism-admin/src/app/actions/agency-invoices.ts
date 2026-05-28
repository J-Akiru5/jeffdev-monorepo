"use server";

/**
 * Agency Invoices Server Actions
 * -------------------------------
 * CRUD operations for invoices, payments, and invoice management.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { generateInvoiceRef, generatePaymentRef } from "@/lib/ref-generator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "paypal" | "gcash" | "bank_transfer" | "cash";
export type Currency = "USD" | "PHP";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  proofUrl?: string;
  notes?: string;
  status: "pending" | "verified" | "rejected";
  paidAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Invoice {
  id?: string;
  refNo: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  projectSlug?: string;
  projectTitle?: string;
  items: InvoiceLineItem[];
  currency: Currency;
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  payments: PaymentRecord[];
  notes?: string;
  termsAndConditions?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Validation Schemas ───────────────────────────────────────────────────────

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

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
  refNo?: string;
  paymentId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateInvoiceTotals(items: { amount: number }[], taxRate?: number, discount?: number) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = taxRate ? subtotal * taxRate : 0;
  const total = subtotal + tax - (discount || 0);
  return { subtotal, tax, total };
}

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
    items: (row.line_items as InvoiceLineItem[]) || [],
    currency: (metadata.currency as Currency) || "USD",
    subtotal: parseFloat(row.amount as string) || 0,
    tax: parseFloat(row.tax_amount as string) || 0,
    taxRate: metadata.taxRate as number | undefined,
    discount: metadata.discount as number | undefined,
    total: parseFloat(row.total_amount as string) || 0,
    paidAmount: (metadata.paidAmount as number) || 0,
    balanceDue: parseFloat(row.total_amount as string) - ((metadata.paidAmount as number) || 0),
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

// ─── Get Invoices ─────────────────────────────────────────────────────────────

export async function getAgencyInvoices(): Promise<Invoice[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => normalizeInvoiceRow(row));
  } catch (error) {
    console.error("[GET AGENCY INVOICES ERROR]", error);
    return [];
  }
}

export async function getAgencyInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return normalizeInvoiceRow(data);
  } catch (error) {
    console.error("[GET AGENCY INVOICE ERROR]", error);
    return null;
  }
}

// ─── Create Invoice ───────────────────────────────────────────────────────────

export async function createAgencyInvoice(data: z.infer<typeof createInvoiceSchema>): Promise<ActionResult> {
  try {
    const validated = createInvoiceSchema.parse(data);
    const { subtotal, tax, total } = calculateInvoiceTotals(validated.items, validated.taxRate, validated.discount);
    const refNo = generateInvoiceRef();

    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return { success: false, error: "Authentication required" };

    const supabase = getAdminClient() as any;
    const { data: result, error } = await supabase.from("invoices").insert({
      user_id: user.id,
      invoice_number: refNo,
      amount: subtotal.toString(),
      tax_amount: tax.toString(),
      total_amount: total.toString(),
      status: "draft",
      issued_date: new Date().toISOString().split("T")[0],
      due_date: validated.dueDate,
      line_items: validated.items,
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
    }).select("id").single();

    if (error) throw error;

    await logAuditEvent({ action: "CREATE", resource: "invoices", resourceId: result.id, details: { refNo, total, currency: validated.currency } });
    revalidatePath("/admin/agency/invoices");

    return { success: true, id: result.id, refNo };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return { success: false, error: `Validation failed: ${fieldErrors}` };
    }
    console.error("[CREATE AGENCY INVOICE ERROR]", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

// ─── Update Invoice ───────────────────────────────────────────────────────────

export async function updateAgencyInvoice(id: string, data: Partial<z.infer<typeof createInvoiceSchema>>): Promise<ActionResult> {
  try {
    const supabase = getAdminClient() as any;
    const { data: existing } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    if (!existing) return { success: false, error: "Invoice not found" };
    if (existing.status !== "draft") return { success: false, error: "Can only edit draft invoices" };

    const validated = createInvoiceSchema.partial().parse(data);
    const existingMetadata = (existing.metadata || {}) as Record<string, unknown>;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (validated.notes !== undefined) updates.notes = validated.notes;
    if (validated.termsAndConditions !== undefined) updates.payment_terms = validated.termsAndConditions;
    if (validated.dueDate) updates.due_date = validated.dueDate;
    if (validated.items) {
      updates.line_items = validated.items;
      const { subtotal, tax, total } = calculateInvoiceTotals(validated.items, validated.taxRate ?? (existingMetadata.taxRate as number), validated.discount ?? (existingMetadata.discount as number));
      updates.amount = subtotal.toString();
      updates.tax_amount = tax.toString();
      updates.total_amount = total.toString();
    }

    updates.metadata = {
      ...existingMetadata,
      ...(validated.clientName && { clientName: validated.clientName }),
      ...(validated.clientEmail && { clientEmail: validated.clientEmail }),
      ...(validated.clientCompany !== undefined && { clientCompany: validated.clientCompany }),
      ...(validated.clientAddress !== undefined && { clientAddress: validated.clientAddress }),
      ...(validated.projectSlug !== undefined && { projectSlug: validated.projectSlug }),
      ...(validated.projectTitle !== undefined && { projectTitle: validated.projectTitle }),
      ...(validated.currency && { currency: validated.currency }),
      ...(validated.taxRate !== undefined && { taxRate: validated.taxRate }),
      ...(validated.discount !== undefined && { discount: validated.discount }),
    };

    const { error } = await supabase.from("invoices").update(updates).eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "invoices", resourceId: id, details: validated });
    revalidatePath("/admin/agency/invoices");
    revalidatePath(`/admin/agency/invoices/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE AGENCY INVOICE ERROR]", error);
    return { success: false, error: "Failed to update invoice" };
  }
}

// ─── Send Invoice ─────────────────────────────────────────────────────────────

export async function sendAgencyInvoice(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient() as any;
    const { data: existing } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    if (!existing) return { success: false, error: "Invoice not found" };
    if (existing.status !== "draft") return { success: false, error: "Invoice already sent" };

    const metadata = (existing.metadata || {}) as Record<string, unknown>;
    metadata.sentAt = new Date().toISOString();

    const { error } = await supabase.from("invoices").update({ status: "sent", metadata, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "STATUS_CHANGE", resource: "invoices", resourceId: id, details: { oldStatus: "draft", newStatus: "sent" } });
    revalidatePath("/admin/agency/invoices");
    revalidatePath(`/admin/agency/invoices/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[SEND AGENCY INVOICE ERROR]", error);
    return { success: false, error: "Failed to send invoice" };
  }
}

// ─── Record Payment ───────────────────────────────────────────────────────────

export async function recordAgencyPayment(invoiceId: string, data: z.infer<typeof paymentSchema>): Promise<ActionResult> {
  try {
    const validated = paymentSchema.parse(data);
    const supabase = getAdminClient() as any;
    const { data: existing } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
    if (!existing) return { success: false, error: "Invoice not found" };

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
    let newStatus = existing.status as string;
    if (newPaidAmount >= total) newStatus = "paid";
    else if (new Date(existing.due_date as string) < new Date()) newStatus = "overdue";
    else newStatus = "sent";

    metadata.payments = [...payments, payment];
    metadata.paidAmount = newPaidAmount;

    const updates: Record<string, unknown> = { metadata, status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "paid") updates.paid_date = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("invoices").update(updates).eq("id", invoiceId);
    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "invoices", resourceId: invoiceId, details: { paymentId: payment.id, amount: validated.amount, method: validated.method } });
    revalidatePath("/admin/agency/invoices");
    revalidatePath(`/admin/agency/invoices/${invoiceId}`);

    return { success: true, paymentId: payment.id };
  } catch (error) {
    console.error("[RECORD PAYMENT ERROR]", error);
    return { success: false, error: "Failed to record payment" };
  }
}

// ─── Delete Invoice ───────────────────────────────────────────────────────────

export async function deleteAgencyInvoice(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient() as any;
    const { data: existing } = await supabase.from("invoices").select("id, status").eq("id", id).maybeSingle();
    if (!existing) return { success: false, error: "Invoice not found" };
    if (existing.status !== "draft") return { success: false, error: "Can only delete draft invoices" };

    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) throw error;

    await logAuditEvent({ action: "DELETE", resource: "invoices", resourceId: id });
    revalidatePath("/admin/agency/invoices");

    return { success: true };
  } catch (error) {
    console.error("[DELETE AGENCY INVOICE ERROR]", error);
    return { success: false, error: "Failed to delete invoice" };
  }
}
