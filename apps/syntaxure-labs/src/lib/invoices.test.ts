import { describe, expect, it } from "vitest";
import { mapInvoiceRow, normalizeLineItems, type InvoiceRow } from "./invoices";

/**
 * Invoice mapping tests
 * ---------------------
 * Pin the translation from the live database row (invoice_number,
 * tax_amount, total_amount, line_items, metadata) to the app's Invoice shape,
 * including the partial/paid derivation from verified payments.
 */

const base: InvoiceRow = {
  id: "inv-1",
  invoice_number: "SYN-2026-001",
  amount: 10000,
  tax_amount: 1200,
  total_amount: 11200,
  status: "sent",
  issued_date: "2026-10-01",
  due_date: "2026-10-15",
  line_items: [{ description: "Design", quantity: 2, unit_price: 5000 }],
  metadata: { currency: "USD" },
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  user_profiles: { full_name: "Client Co", email: "client@example.com" },
};

describe("mapInvoiceRow", () => {
  it("maps the live columns into the app shape", () => {
    const invoice = mapInvoiceRow(base);

    expect(invoice.refNo).toBe("SYN-2026-001");
    expect(invoice.clientName).toBe("Client Co");
    expect(invoice.clientEmail).toBe("client@example.com");
    expect(invoice.currency).toBe("USD");
    expect(invoice.total).toBe(11200);
    expect(invoice.tax).toBe(1200);
    expect(invoice.balanceDue).toBe(11200);
    expect(invoice.status).toBe("sent");
    expect(invoice.items[0]).toMatchObject({
      description: "Design",
      quantity: 2,
      unit_price: 5000,
      amount: 10000,
      total: 10000,
    });
  });

  it("derives partial and paid from verified payments", () => {
    expect(mapInvoiceRow(base, 5000).status).toBe("partial");
    expect(mapInvoiceRow(base, 5000).balanceDue).toBe(6200);
    expect(mapInvoiceRow(base, 11200).status).toBe("paid");
    expect(mapInvoiceRow(base, 20000).balanceDue).toBe(0);
  });

  it("keeps draft and cancelled statuses untouched", () => {
    expect(mapInvoiceRow({ ...base, status: "draft" }).status).toBe("draft");
    expect(mapInvoiceRow({ ...base, status: "cancelled" }).status).toBe(
      "cancelled",
    );
  });

  it("handles array profile joins, missing metadata, and a missing total", () => {
    const invoice = mapInvoiceRow({
      ...base,
      user_profiles: [{ full_name: "Array Client", email: "array@example.com" }],
      metadata: null,
      total_amount: null,
    });

    expect(invoice.clientName).toBe("Array Client");
    expect(invoice.currency).toBe("PHP");
    expect(invoice.total).toBe(10000); // falls back to amount
  });
});

describe("normalizeLineItems", () => {
  it("returns an empty list for null", () => {
    expect(normalizeLineItems(null)).toEqual([]);
  });

  it("normalises alternate item shapes", () => {
    const items = normalizeLineItems([
      { name: "X", qty: 3, amount: 100 },
      { total: 250 },
    ]);

    expect(items[0]).toMatchObject({
      description: "X",
      quantity: 3,
      amount: 100,
      total: 100,
    });
    expect(items[1]).toMatchObject({
      description: "Item",
      quantity: 1,
      amount: 250,
      total: 250,
    });
  });
});
