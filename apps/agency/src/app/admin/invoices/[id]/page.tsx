import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, X, ExternalLink } from 'lucide-react';
import { getInvoices } from '@/app/actions/invoice';
import { InvoiceDownload } from '@/components/invoice/invoice-download';
import type { InvoiceStatus, PaymentRecord } from '@/types/invoice';

export const dynamic = 'force-dynamic';

/**
 * Invoice Detail Page
 * --------------------
 * View and manage individual invoice.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-white/10 text-white/60 border-white/20',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const invoices = await getInvoices();
  const invoice = invoices.find((i) => i.id === id);

  if (!invoice) notFound();

  return (
    <div>
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      {/* Header */}
      <div className="mt-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-cyan-400">
              {invoice.refNo}
            </h1>
            <span
              className={`rounded-md border px-3 py-1 text-sm ${statusColors[invoice.status]}`}
            >
              {invoice.status}
            </span>
          </div>
          <p className="mt-2 text-white">{invoice.clientName}</p>
          {invoice.clientCompany && (
            <p className="text-white/50">{invoice.clientCompany}</p>
          )}
        </div>

        <div className="flex gap-2">
          {/* Download PDF Button */}
          <InvoiceDownload
            invoice={invoice}
            className="flex items-center gap-2 rounded-md bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
          />

          <Link
            href={`/pay/${invoice.refNo}?preview=admin`}
            target="_blank"
            className="flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            {invoice.status === 'draft' ? 'Preview Payment Page' : 'View Payment Page'}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-8">
        {/* Invoice Details */}
        <div className="col-span-2 space-y-6">
          {/* Line Items */}
          <div className="rounded-md border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 font-semibold text-white">Line Items</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-sm text-white/50">
                  <th className="pb-3 text-left">Description</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="py-3 text-white">{item.description}</td>
                    <td className="py-3 text-right text-white/70">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-white/70">
                      {invoice.currency === 'USD' ? '$' : '₱'}
                      {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-medium text-white">
                      {invoice.currency === 'USD' ? '$' : '₱'}
                      {item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <div className="flex justify-between text-white/50">
                <span>Subtotal</span>
                <span>
                  {invoice.currency === 'USD' ? '$' : '₱'}
                  {invoice.subtotal.toLocaleString()}
                </span>
              </div>
              {invoice.tax && invoice.tax > 0 && (
                <div className="flex justify-between text-white/50">
                  <span>Tax ({((invoice.taxRate || 0) * 100).toFixed(0)}%)</span>
                  <span>
                    {invoice.currency === 'USD' ? '$' : '₱'}
                    {invoice.tax.toLocaleString()}
                  </span>
                </div>
              )}
              {invoice.discount && invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>
                    -{invoice.currency === 'USD' ? '$' : '₱'}
                    {invoice.discount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold text-white">
                <span>Total</span>
                <span>
                  {invoice.currency === 'USD' ? '$' : '₱'}
                  {invoice.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Paid</span>
                <span className="text-emerald-400">
                  {invoice.currency === 'USD' ? '$' : '₱'}
                  {invoice.paidAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Balance Due</span>
                <span
                  className={
                    invoice.balanceDue > 0 ? 'text-yellow-400' : 'text-emerald-400'
                  }
                >
                  {invoice.currency === 'USD' ? '$' : '₱'}
                  {invoice.balanceDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-md border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 font-semibold text-white">Payment History</h3>
            {invoice.payments.length > 0 ? (
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <PaymentStatusBadge status={payment.status} />
                      <div>
                        <p className="font-mono text-sm text-white/50">
                          {payment.id}
                        </p>
                        <p className="text-white">
                          {payment.method.toUpperCase()} •{' '}
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">
                        +{invoice.currency === 'USD' ? '$' : '₱'}
                      </p>
                      {payment.transactionId && (
                        <p className="text-xs text-white/30">
                          {payment.transactionId}
                        </p>
                      )}
                      {payment.proofUrl && (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-xs text-cyan-400 hover:underline"
                        >
                          View Proof
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/30">No payments recorded</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="rounded-md border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 font-semibold text-white">Client</h3>
            <div className="space-y-2 text-sm">
              <p className="text-white">{invoice.clientName}</p>
              <p className="text-white/50">{invoice.clientEmail}</p>
              {invoice.clientCompany && (
                <p className="text-white/50">{invoice.clientCompany}</p>
              )}
              {invoice.clientAddress && (
                <p className="text-white/30">{invoice.clientAddress}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-md border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 font-semibold text-white">Dates</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Issued</span>
                <span className="text-white">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Due</span>
                <span
                  className={
                    new Date(invoice.dueDate) < new Date() &&
                    invoice.status !== 'paid'
                      ? 'text-red-400'
                      : 'text-white'
                  }
                >
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-white/50">Sent</span>
                  <span className="text-white">
                    {new Date(invoice.sentAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-white/50">Paid</span>
                  <span className="text-emerald-400">
                    {new Date(invoice.paidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Project Link */}
          {invoice.projectSlug && (
            <div className="rounded-md border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 font-semibold text-white">Project</h3>
              <Link
                href={`/admin/projects/${invoice.projectSlug}`}
                className="text-cyan-400 hover:underline"
              >
                {invoice.projectTitle || invoice.projectSlug}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentRecord['status'] }) {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    verified: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  const icons = {
    pending: null,
    verified: <Check className="h-3 w-3" />,
    rejected: <X className="h-3 w-3" />,
  };

  return (
    <span
      className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs ${colors[status]}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}
