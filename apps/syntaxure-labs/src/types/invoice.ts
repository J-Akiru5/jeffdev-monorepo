/**
 * Invoice & Payment Types
 * -------------------------
 * Type definitions for invoices, payments, and subscriptions.
 */

// =============================================================================
// INVOICE STATUS
// =============================================================================
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'paypal' | 'gcash' | 'bank_transfer' | 'cash';
export type Currency = 'USD' | 'PHP';

// =============================================================================
// LINE ITEM
// =============================================================================
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number; // quantity * unitPrice
}

// =============================================================================
// PAYMENT RECORD
// =============================================================================
export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string; // PayPal transaction ID
  proofUrl?: string; // GCash proof image URL
  notes?: string;
  status: 'pending' | 'verified' | 'rejected';
  paidAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// =============================================================================
// INVOICE
// =============================================================================
export interface Invoice {
  id?: string;
  refNo: string; // INV-XXXXXX
  
  // Client Info
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  
  // Project Link
  projectSlug?: string;
  projectTitle?: string;
  
  // Line Items
  items: InvoiceLineItem[];
  
  // Amounts
  currency: Currency;
  subtotal: number;
  tax?: number;
  taxRate?: number; // e.g., 0.12 for 12%
  discount?: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  
  // Status
  status: InvoiceStatus;
  
  // Dates
  issueDate: string;
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  
  // Payment History
  payments: PaymentRecord[];
  
  // Notes
  notes?: string;
  termsAndConditions?: string;
  
  // Meta
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// SUBSCRIPTION (For SaaS)
// =============================================================================
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  features: string[];
}

export interface Subscription {
  id?: string;
  refNo: string; // SUB-XXXXXX
  
  // Client
  clientName: string;
  clientEmail: string;
  
  // Plan
  planId: string;
  planName: string;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  
  // Status
  status: SubscriptionStatus;
  
  // Dates
  startDate: string;
  nextBillingDate: string;
  cancelledAt?: string;
  
  // PayPal
  paypalSubscriptionId?: string;
  
  // Meta
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// PAYPAL TYPES
// =============================================================================
export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: {
    amount: {
      currency_code: string;
      value: string;
    };
    reference_id?: string;
  }[];
}
