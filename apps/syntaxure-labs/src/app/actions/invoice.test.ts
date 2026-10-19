import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Invoice action tests
 * --------------------
 * The Supabase client is mocked. These tests pin the live-schema contract:
 * lookups by `invoice_number` (not the nonexistent `ref_no`), verified-only
 * payment totals, and pending payment inserts.
 */

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => ({ from: mocks.from }),
}));

interface Sink {
  inserts?: unknown[];
  eqs?: Array<[string, unknown]>;
}

function chain(result: unknown, sink: Sink = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {
    select: () => q,
    eq: (column: string, value: unknown) => {
      sink.eqs?.push([column, value]);
      return q;
    },
    insert: (payload: unknown) => {
      sink.inserts?.push(payload);
      return q;
    },
    maybeSingle: async () => result,
    single: async () => result,
    then: (resolve: (value: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

const invoiceRow = {
  id: "inv-1",
  invoice_number: "SYN-2026-001",
  amount: 10000,
  tax_amount: 1200,
  total_amount: 11200,
  status: "sent",
  issued_date: "2026-10-01",
  due_date: "2026-10-15",
  line_items: [{ description: "Design", quantity: 1, unit_price: 10000 }],
  metadata: { currency: "PHP" },
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  user_profiles: { full_name: "Client Co", email: "client@example.com" },
};

import { getInvoiceByRefNo, recordPayment } from "./invoice";

beforeEach(() => {
  mocks.from.mockReset();
});

describe("getInvoiceByRefNo", () => {
  it("queries by invoice_number and totals verified payments", async () => {
    const invoiceSink: Sink = { eqs: [] };
    const paymentsSink: Sink = { eqs: [] };

    mocks.from.mockImplementation((table: string) => {
      if (table === "invoices") {
        return chain({ data: invoiceRow, error: null }, invoiceSink);
      }
      if (table === "payments") {
        return chain({ data: [{ amount: 5000 }], error: null }, paymentsSink);
      }
      throw new Error(`unexpected table ${table}`);
    });

    const invoice = await getInvoiceByRefNo("SYN-2026-001");

    expect(invoice?.refNo).toBe("SYN-2026-001");
    expect(invoice?.status).toBe("partial");
    expect(invoice?.paidAmount).toBe(5000);
    expect(invoiceSink.eqs).toContainEqual(["invoice_number", "SYN-2026-001"]);
    expect(paymentsSink.eqs).toContainEqual(["status", "verified"]);
    expect(paymentsSink.eqs).toContainEqual(["invoice_id", "inv-1"]);
  });

  it("returns null when the invoice does not exist", async () => {
    mocks.from.mockReturnValue(chain({ data: null, error: null }));

    expect(await getInvoiceByRefNo("UNKNOWN")).toBeNull();
  });

  it("returns null on a database error", async () => {
    mocks.from.mockReturnValue(
      chain({ data: null, error: { message: "boom" } }),
    );

    expect(await getInvoiceByRefNo("SYN-2026-001")).toBeNull();
  });

  it("ignores empty or oversized ref numbers", async () => {
    expect(await getInvoiceByRefNo("   ")).toBeNull();
    expect(await getInvoiceByRefNo("x".repeat(65))).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("recordPayment", () => {
  it("inserts a pending payment", async () => {
    const sink: Sink = { inserts: [] };
    mocks.from.mockReturnValue(chain({ data: { id: "pay-1" }, error: null }, sink));

    const result = await recordPayment("inv-1", {
      amount: 5000,
      method: "gcash",
      proofUrl: "2026/10/abc-receipt.png",
      notes: "GCash payment - Pending verification",
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe("pay-1");
    expect(sink.inserts?.[0]).toMatchObject({
      invoice_id: "inv-1",
      amount: 5000,
      method: "gcash",
      proof_url: "2026/10/abc-receipt.png",
      status: "pending",
    });
  });

  it("rejects invalid amounts without touching the database", async () => {
    const result = await recordPayment("inv-1", { amount: 0, method: "gcash" });

    expect(result.success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects missing methods", async () => {
    const result = await recordPayment("inv-1", { amount: 100, method: "  " });

    expect(result.success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("reports database failures", async () => {
    mocks.from.mockReturnValue(
      chain({ data: null, error: { message: "constraint" } }),
    );

    const result = await recordPayment("inv-1", { amount: 100, method: "gcash" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/failed to record/i);
  });
});
