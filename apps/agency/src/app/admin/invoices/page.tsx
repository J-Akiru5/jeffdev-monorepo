import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { getInvoices } from '@/app/actions/invoice';
import type { Invoice, InvoiceStatus } from '@/types/invoice';
import { PriceDisplay } from '@/components/ui/price-display';

export const dynamic = 'force-dynamic';

/**
 * Admin Invoices Page
 * --------------------
 * List all invoices with status and actions.
 */

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-white/10 text-white/60',
  sent: 'bg-blue-500/20 text-blue-400',
  partial: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-emerald-500/20 text-emerald-400',
  overdue: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-white/5 text-white/30',
};

export default async function AdminInvoicesPage() {
  const invoices = await getInvoices();

  // Group by status
  const grouped = invoices.reduce((acc, inv) => {
    const status = inv.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(inv);
    return acc;
  }, {} as Record<InvoiceStatus, Invoice[]>);

  const statusOrder: InvoiceStatus[] = ['sent', 'partial', 'overdue', 'draft', 'paid', 'cancelled'];

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoices</h1>
          <p className="mt-2 text-white/50">
            {invoices.length} total invoices
          </p>
        </div>

        <Link
          href="/admin/invoices/new"
          className="flex items-center gap-2 rounded-md bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-4 gap-4">
        {[
          {
            label: 'Outstanding',
            value: invoices
              .filter((i) => ['sent', 'partial', 'overdue'].includes(i.status))
              .reduce((sum, i) => sum + i.balanceDue, 0),
            currency: 'USD',
          },
          {
            label: 'Paid This Month',
            value: invoices
              .filter(
                (i) =>
                  i.status === 'paid' &&
                  i.paidAt &&
                  new Date(i.paidAt).getMonth() === new Date().getMonth()
              )
              .reduce((sum, i) => sum + i.total, 0),
            currency: 'USD',
          },
          {
            label: 'Pending Verification',
            value: invoices.filter((i) =>
              i.payments.some((p) => p.status === 'pending')
            ).length,
            isCount: true,
          },
          {
            label: 'Overdue',
            value: invoices.filter((i) => i.status === 'overdue').length,
            isCount: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <p className="text-sm text-white/50">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {stat.isCount ? (
                stat.value
              ) : (
                <>
                  ${(stat.value as number).toLocaleString()}
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Invoice List */}
      <div className="mt-8 space-y-8">
        {statusOrder.map((status) => {
          const items = grouped[status];
          if (!items || items.length === 0) return null;

          return (
            <div key={status}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span
                  className={`rounded-sm px-2 py-0.5 text-xs uppercase ${statusColors[status]}`}
                >
                  {status}
                </span>
                <span className="text-white/30">({items.length})</span>
              </h2>

              <div className="space-y-2">
                {items.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/admin/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-mono text-sm text-cyan-400">
                          {invoice.refNo}
                        </p>
                        <p className="text-white">{invoice.clientName}</p>
                        {invoice.projectTitle && (
                          <p className="text-sm text-white/40">
                            {invoice.projectTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">
                          <PriceDisplay amount={invoice.total} sourceCurrency={invoice.currency} />
                        </p>
                        {invoice.balanceDue > 0 && invoice.balanceDue < invoice.total && (
                          <div className="flex items-center justify-end text-sm text-yellow-400">
                            <PriceDisplay
                              amount={invoice.balanceDue}
                              sourceCurrency={invoice.currency}
                            />
                            <span className="ml-1">due</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-white/40">
                        Due {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {invoices.length === 0 && (
          <div className="py-12 text-center text-white/30">
            No invoices yet. Create your first invoice.
          </div>
        )}
      </div>
    </div>
  );
}
