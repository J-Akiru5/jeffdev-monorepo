/**
 * Generate Reference Number
 * --------------------------
 * Creates short, unique reference numbers for quotes/invoices.
 */

import { nanoid } from "nanoid";

/**
 * Generate a quote reference number
 * Format: QT-XXXXXX (e.g., QT-7X3K9B)
 */
export function generateQuoteRef(): string {
  return `QT-${nanoid(6).toUpperCase()}`;
}

/**
 * Generate an invoice reference number
 * Format: INV-XXXXXX (e.g., INV-9Z2M4A)
 */
export function generateInvoiceRef(): string {
  return `INV-${nanoid(6).toUpperCase()}`;
}

/**
 * Generate a payment reference number
 * Format: PAY-XXXXXX
 */
export function generatePaymentRef(): string {
  return `PAY-${nanoid(6).toUpperCase()}`;
}
