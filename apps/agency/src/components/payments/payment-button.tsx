'use client';

/**
 * Payment Button Component
 * -------------------------
 * PayPal Smart Button + GCash QR option.
 */

import { useState, useTransition } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CreditCard, QrCode, Loader2 } from 'lucide-react';
import { createPayPalOrder, capturePayPalOrder } from '@/app/actions/paypal';
import { GcashProofUpload } from './gcash-proof-upload';
import type { Invoice } from '@/types/invoice';

interface PaymentButtonProps {
  invoice: Invoice;
  onSuccess: () => void;
}

type PaymentTab = 'paypal' | 'gcash';

export function PaymentButton({ invoice, onSuccess }: PaymentButtonProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('paypal');
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(invoice.balanceDue.toString());

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  const tabs: { id: PaymentTab; label: string; icon: typeof CreditCard }[] = [
    { id: 'paypal', label: 'PayPal / Card', icon: CreditCard },
    { id: 'gcash', label: 'GCash QR', icon: QrCode },
  ];

  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-6">
      {/* Tab Selector */}
      <div className="mb-6 flex gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Partial Payment Input */}
      <div className="mb-6">
        <label className="mb-2 block text-sm text-white/50">Payment Amount</label>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">
            {invoice.currency === 'USD' ? '$' : '₱'}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={invoice.balanceDue}
            step="0.01"
            className="w-32 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-lg font-semibold text-white outline-none focus:border-cyan-500/50"
          />
          <span className="text-sm text-white/30">
            of {invoice.currency === 'USD' ? '$' : '₱'}
            {invoice.balanceDue.toLocaleString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* PayPal Tab */}
      {activeTab === 'paypal' && paypalClientId && (
        <PayPalScriptProvider
          options={{
            clientId: paypalClientId,
            currency: invoice.currency,
          }}
        >
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'black',
              shape: 'rect',
              label: 'pay',
              height: 45,
            }}
            createOrder={async () => {
              setError(null);
              const result = await createPayPalOrder(invoice.refNo, parseFloat(amount));
              if (result.success && result.orderId) {
                return result.orderId;
              }
              setError(result.error || 'Failed to create order');
              throw new Error(result.error);
            }}
            onApprove={async (data) => {
              const result = await capturePayPalOrder(data.orderID, invoice.refNo);
              if (result.success) {
                onSuccess();
              } else {
                setError(result.error || 'Payment failed');
              }
            }}
            onError={(err) => {
              console.error('PayPal error:', err);
              setError('Payment failed. Please try again.');
            }}
          />
        </PayPalScriptProvider>
      )}

      {/* GCash Tab */}
      {activeTab === 'gcash' && (
        <GcashProofUpload
          invoice={invoice}
          amount={parseFloat(amount)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
