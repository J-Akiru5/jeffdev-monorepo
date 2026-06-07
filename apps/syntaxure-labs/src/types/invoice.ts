/**
 * Invoice Types (Stub)
 * ---------------------
 * Placeholder for invoice type definitions.
 */

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  unitPrice: number;
  amount: number;
  total: number;
}

export interface Invoice {
  id: string;
  ref_no: string;
  refNo?: string;
  status: InvoiceStatus;
  amount: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  currency: "USD" | "PHP" | string;
  client_name: string;
  clientName?: string;
  client_email: string;
  clientEmail?: string;
  client_company?: string;
  clientCompany?: string;
  client_address?: string;
  clientAddress?: string;
  project_title?: string;
  projectTitle?: string;
  issue_date: string;
  issueDate?: string;
  due_date: string;
  dueDate?: string;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}
