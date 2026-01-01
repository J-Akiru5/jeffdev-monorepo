import { notFound } from 'next/navigation';
import { getInvoiceByRefNo } from '@/app/actions/invoice';
import { PaymentButton } from '@/components/payments';
import type { InvoiceStatus } from '@/types/invoice';
import { PriceDisplay } from '@/components/ui/price-display';

export const dynamic = 'force-dynamic';

/**
 * Public Payment Page
 * --------------------
 * Client-facing invoice payment page.
 */

interface PageProps {
  params: Promise<{ refNo: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const statusMessages: Record<InvoiceStatus, { title: string; description: string }> = {
  draft: { title: 'Invoice Not Ready', description: 'This invoice is still being prepared.' },
  sent: { title: 'Payment Due', description: 'Please complete your payment below.' },
  partial: { title: 'Partial Payment Received', description: 'Complete your remaining balance below.' },
  paid: { title: 'Fully Paid', description: 'Thank you for your payment!' },
  overdue: { title: 'Payment Overdue', description: 'Please complete your payment as soon as possible.' },
  cancelled: { title: 'Invoice Cancelled', description: 'This invoice has been cancelled.' },
};

export default async function PublicPaymentPage({ params, searchParams }: PageProps) {
  const { refNo } = await params;
  const { preview } = await searchParams;
  const invoice = await getInvoiceByRefNo(refNo);

  if (!invoice) notFound();

  // Show "Not Ready" screen if draft AND not in admin preview mode
  if (invoice.status === 'draft' && preview !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Invoice Not Ready</h1>
          <p className="mt-2 text-white/50">This invoice is still being prepared.</p>
        </div>
      </div>
    );
  }

  const statusInfo = statusMessages[invoice.status];

  return (
    <div className="min-h-screen bg-void px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 font-mono text-sm text-white/30">INVOICE</div>
          <h1 className="text-3xl font-bold text-cyan-400">{invoice.refNo}</h1>
          <p className="mt-2 text-white/50">from JD Studio</p>
        </div>

        {/* Status Banner */}
        <div
          className={`mb-8 rounded-md p-4 text-center ${
            invoice.status === 'paid'
              ? 'bg-emerald-500/10 text-emerald-400'
              : invoice.status === 'overdue'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-cyan-500/10 text-cyan-400'
          }`}
        >
          <h2 className="text-lg font-semibold">{statusInfo.title}</h2>
          <p className="text-sm opacity-80">{statusInfo.description}</p>
        </div>

        {/* Invoice Summary */}
        <div className="mb-8 rounded-md border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-sm font-medium text-white/50">BILL TO</h3>
          <p className="text-lg font-semibold text-white">{invoice.clientName}</p>
          {invoice.clientCompany && (
            <p className="text-white/50">{invoice.clientCompany}</p>
          )}
          <p className="text-sm text-white/30">{invoice.clientEmail}</p>

          <hr className="my-6 border-white/10" />

          {/* Line Items Summary */}
          <div className="space-y-2">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white/70">
                  {item.description} × {item.quantity}
                </span>
                <span className="text-white">
                  <PriceDisplay amount={item.amount} sourceCurrency={invoice.currency} />
                </span>
              </div>
            ))}
          </div>

          <hr className="my-6 border-white/10" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/50">
              <span>Subtotal</span>
              <PriceDisplay amount={invoice.subtotal} sourceCurrency={invoice.currency} />
            </div>
            {invoice.tax && invoice.tax > 0 && (
              <div className="flex justify-between text-sm text-white/50">
                <span>Tax</span>
                <PriceDisplay amount={invoice.tax} sourceCurrency={invoice.currency} />
              </div>
            )}
            {invoice.discount && invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Discount</span>
                <div className="flex">
                  -
                  <PriceDisplay
                    amount={invoice.discount}
                    sourceCurrency={invoice.currency}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between pt-2 text-lg font-bold">
              <span className="text-white">Total</span>
              <span className="text-white">
                <PriceDisplay amount={invoice.total} sourceCurrency={invoice.currency} />
              </span>
            </div>
            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Paid</span>
                <div className="flex">
                  -
                  <PriceDisplay
                    amount={invoice.paidAmount}
                    sourceCurrency={invoice.currency}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between border-t border-white/10 pt-2 text-xl font-bold">
              <span className="text-white">Balance Due</span>
              <span
                className={
                  invoice.balanceDue > 0 ? 'text-cyan-400' : 'text-emerald-400'
                }
              >
                <PriceDisplay amount={invoice.balanceDue} sourceCurrency={invoice.currency} />
              </span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {invoice.balanceDue > 0 && invoice.status !== 'cancelled' && (
          <PaymentButton
            invoice={invoice}
            onSuccess={() => {
              // Client-side redirect will handle this
            }}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/30">
          <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p className="mt-2">
            Questions? Contact us at{' '}
            <a
              href="mailto:hello@jeffdev.studio"
              className="text-cyan-400 hover:underline"
            >
              hello@jeffdev.studio
            </a>
          </p>
          <p className="mt-4">
            © {new Date().getFullYear()} JeffDev Web Development Services
          </p>
        </div>
      </div>
    </div>
  );
}
