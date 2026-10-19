"use server";

/**
 * Invoice Server Actions
 * ----------------------
 * Public payment page + payment recording.
 *
 * The live schema stores `invoice_number` / `tax_amount` / `line_items` (the
 * older `ref_no` / `items` names never existed), so lookups go through the
 * tested mapper in `lib/invoices.ts`.
 *
 * Verified payments only reduce the balance; pending proofs (GCash etc.) wait
 * for admin verification.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { mapInvoiceRow, type InvoiceRow } from "@/lib/invoices";
import type { Invoice } from "@/types/invoice";

export async function getInvoiceByRefNo(
  refNo: string,
): Promise<Invoice | null> {
  const ref = (refNo || "").trim();
  if (!ref || ref.length > 64) return null;

  try {
    const supabase = getAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("invoices")
      .select("*, user_profiles(full_name, email)")
      .eq("invoice_number", ref)
      .maybeSingle();

    if (error || !data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: payments } = await (supabase as any)
      .from("payments")
      .select("amount")
      .eq("invoice_id", data.id)
      .eq("status", "verified");

    const paid = (payments || []).reduce(
      (sum: number, payment: { amount: number | string | null }) =>
        sum + Number(payment.amount || 0),
      0,
    );

    return mapInvoiceRow(data as InvoiceRow, paid);
  } catch (error) {
    console.error("[INVOICE] lookup failed", error);
    return null;
  }
}

export async function recordPayment(
  invoiceId: string,
  data: {
    amount: number;
    method: string;
    transactionId?: string;
    proofUrl?: string;
    notes?: string;
  },
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  if (!invoiceId) return { success: false, error: "Missing invoice" };

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Invalid payment amount" };
  }

  const method = String(data.method || "")
    .trim()
    .slice(0, 40);
  if (!method) return { success: false, error: "Missing payment method" };

  try {
    const supabase = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        amount,
        method,
        transaction_id: data.transactionId ?? null,
        proof_url: data.proofUrl ?? null,
        notes: data.notes ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    return { success: true, paymentId: row?.id };
  } catch (error) {
    console.error("[INVOICE] record payment failed", error);
    return { success: false, error: "Failed to record payment" };
  }
}
