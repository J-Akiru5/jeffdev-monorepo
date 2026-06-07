"use server";

/**
 * Invoice Server Actions (Stub)
 * ------------------------------
 * Placeholder for invoice functionality.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import type { Invoice, InvoiceItem } from "@/types/invoice";

export async function getInvoiceByRefNo(refNo: string): Promise<Invoice | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase as any)
      .from("invoices")
      .select("*")
      .eq("ref_no", refNo)
      .single();
    if (error || !data) return null;
    return {
      ...data,
      refNo: data.ref_no,
      items: (data.items || []) as InvoiceItem[],
    } as Invoice;
  } catch {
    return null;
  }
}

export async function recordPayment(invoiceId: string, data: { amount: number; method: string; transactionId?: string; proofUrl?: string; notes?: string }) {
  try {
    const supabase = getAdminClient();
    const { error } = await (supabase as any).from("payments").insert({
      invoice_id: invoiceId,
      amount: data.amount,
      method: data.method,
      transaction_id: data.transactionId,
      proof_url: data.proofUrl,
      notes: data.notes,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false, error: "Failed to record payment" };
  }
}
