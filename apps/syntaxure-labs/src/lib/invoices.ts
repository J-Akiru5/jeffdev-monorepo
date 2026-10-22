/**
 * Invoice mapping (pure)
 * ----------------------
 * The public /pay page expects the app's Invoice shape, while the database
 * stores a leaner row (invoice_number, amount, tax_amount, total_amount,
 * issued_date, due_date, line_items, metadata) plus an optional profile join.
 * Keep the translation here so it is unit-testable without Supabase.
 */

import type { Invoice, InvoiceItem } from "@/types/invoice";

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: number | string | null;
  tax_amount: number | string | null;
  total_amount: number | string | null;
  status: string | null;
  issued_date: string | null;
  due_date: string | null;
  line_items: unknown;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user_profiles?:
    | { full_name?: string | null; email?: string | null }
    | { full_name?: string | null; email?: string | null }[]
    | null;
}

function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeLineItems(raw: unknown): InvoiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    const quantity = num(row.quantity ?? row.qty, 1) || 1;
    const unitPrice = num(row.unit_price ?? row.unitPrice ?? row.amount, 0);
    const amount = num(row.amount ?? row.total, 0) || round2(quantity * unitPrice);
    return {
      id: String(row.id ?? index),
      description: String(row.description ?? row.name ?? "Item"),
      quantity,
      unit_price: unitPrice,
      unitPrice,
      amount,
      total: amount,
    };
  });
}

/** Maps a database invoice row (+ verified payments total) to the app shape. */
export function mapInvoiceRow(row: InvoiceRow, paidAmount = 0): Invoice {
  const profile = Array.isArray(row.user_profiles)
    ? row.user_profiles[0]
    : row.user_profiles;

  const amount = num(row.amount, 0);
  const total = num(row.total_amount, amount);
  const paid = Math.max(0, num(paidAmount, 0));
  const balanceDue = Math.max(0, round2(total - paid));

  const metadata = row.metadata ?? {};
  const currency =
    typeof metadata.currency === "string" && metadata.currency
      ? metadata.currency
      : "PHP";
  const projectTitle =
    typeof metadata.project_title === "string"
      ? metadata.project_title
      : undefined;

  const dbStatus = (row.status || "sent") as Invoice["status"];
  const status: Invoice["status"] =
    dbStatus === "cancelled" || dbStatus === "draft"
      ? dbStatus
      : balanceDue <= 0 && total > 0
        ? "paid"
        : paid > 0
          ? "partial"
          : dbStatus === "overdue"
            ? "overdue"
            : "sent";

  const clientName = profile?.full_name || "Client";
  const clientEmail = profile?.email || "";
  const issueDate = row.issued_date || row.created_at;
  const dueDate = row.due_date || row.created_at;

  return {
    id: row.id,
    ref_no: row.invoice_number,
    refNo: row.invoice_number,
    status,
    amount,
    subtotal: amount,
    tax: num(row.tax_amount, 0),
    taxRate: 0,
    discount: 0,
    total,
    paidAmount: paid,
    balanceDue,
    currency,
    client_name: clientName,
    clientName,
    client_email: clientEmail,
    clientEmail,
    project_title: projectTitle,
    projectTitle,
    issue_date: issueDate,
    issueDate,
    due_date: dueDate,
    dueDate,
    items: normalizeLineItems(row.line_items),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
