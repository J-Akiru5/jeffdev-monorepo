import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { notFound } from "next/navigation";
import { sendAgencyInvoice } from "@/app/actions/agency-invoices";
import { getAgencyInvoiceById } from "@/app/actions/agency-invoices";

/**
 * Agency Invoice Detail Page
 * ---------------------------
 * View and manage a single invoice.
 */

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  overdue: "bg-red-500/20 text-red-400",
  cancelled: "bg-white/5 text-white/30",
};

function SendInvoiceButton({ id }: { id: string }) {
  return (
    <form action={sendAgencyInvoice.bind(null, id)}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/30 transition-colors"
      >
        <Send className="h-4 w-4" />
        Send Invoice
      </button>
    </form>
  );
}

export default async function AgencyInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getAgencyInvoiceById(id);
  if (!invoice) notFound();

  const currencySymbol = invoice.currency === "PHP" ? "₱" : "$";

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/agency/invoices"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{invoice.refNo}</h1>
            <span
              className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                statusColors[invoice.status] || "bg-white/10 text-white/40"
              }`}
            >
              {invoice.status}
            </span>
          </div>
          <p className="text-sm text-white/50">
            {invoice.clientName} · {invoice.clientEmail}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "draft" && (
            <>
              <SendInvoiceButton id={id} />
              <Link
                href={`/admin/agency/invoices/${id}/edit`}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
              >
                Edit
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-white/40 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-white">
            {currencySymbol}{invoice.total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-white/40 mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-400">
            {currencySymbol}{invoice.paidAmount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-white/40 mb-1">Balance Due</p>
          <p className="text-2xl font-bold text-cyan-400">
            {currencySymbol}{invoice.balanceDue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Client & Date Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-2">
          <h3 className="text-sm font-medium text-white/80">Client</h3>
          <p className="text-sm text-white/70">{invoice.clientName}</p>
          <p className="text-sm text-white/50">{invoice.clientEmail}</p>
          {invoice.clientCompany && (
            <p className="text-sm text-white/50">{invoice.clientCompany}</p>
          )}
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-2">
          <h3 className="text-sm font-medium text-white/80">Dates</h3>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Issued</span>
            <span className="text-white/70">{invoice.issueDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Due</span>
            <span className="text-white/70">{invoice.dueDate}</span>
          </div>
          {invoice.paidAt && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Paid</span>
              <span className="text-emerald-400">{invoice.paidAt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-white/80">Line Items</h3>
        </div>
        <div className="divide-y divide-white/5">
          {invoice.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-white/80">{item.description}</p>
                <p className="text-xs text-white/40">
                  {item.quantity} × {currencySymbol}{item.unitPrice.toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-white/70 font-mono">
                {currencySymbol}{item.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Subtotal</span>
            <span className="text-white/70">{currencySymbol}{invoice.subtotal.toLocaleString()}</span>
          </div>
          {(invoice.tax ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Tax</span>
              <span className="text-white/70">{currencySymbol}{invoice.tax.toLocaleString()}</span>
            </div>
          )}
          {invoice.discount && invoice.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Discount</span>
              <span className="text-red-400">-{currencySymbol}{invoice.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-medium pt-1 border-t border-white/10">
            <span className="text-white/60">Total</span>
            <span className="text-white font-bold">{currencySymbol}{invoice.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-medium text-white/80">Payment History</h3>
          </div>
          <div className="divide-y divide-white/5">
            {invoice.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white/80">{payment.method}</p>
                  <p className="text-xs text-white/40">
                    {payment.status === "verified" ? "✅ Verified" : payment.status === "pending" ? "⏳ Pending" : "❌ Rejected"}
                  </p>
                </div>
                <p className="text-sm text-emerald-400 font-mono">
                  {currencySymbol}{payment.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <h3 className="text-sm font-medium text-white/80 mb-2">Notes</h3>
          <p className="text-sm text-white/60">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
