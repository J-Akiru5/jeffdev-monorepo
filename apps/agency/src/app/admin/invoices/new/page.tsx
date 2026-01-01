'use client';

/**
 * New Invoice Form
 * -----------------
 * Create a new invoice with line items.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { createInvoice } from '@/app/actions/invoice';
import type { Currency } from '@/types/invoice';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  });
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [sendOnCreate, setSendOnCreate] = useState(true);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Recalculate amount
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = updated.quantity * updated.unitPrice;
        }

        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Client name and email are required');
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      setError('All line items must have a description');
      return;
    }

    startTransition(async () => {
      const result = await createInvoice({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientCompany: clientCompany.trim() || undefined,
        currency,
        dueDate,
        items,
        notes: notes.trim() || undefined,
        sendOnCreate,
      });

      if (result.success) {
        router.push('/admin/invoices');
      } else {
        setError(result.error || 'Failed to create invoice');
      }
    });
  };

  return (
    <div>
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      <h1 className="mt-8 text-3xl font-bold text-white">New Invoice</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Client Info */}
        <div className="rounded-md border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-semibold text-white">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/50">
                Client Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/50">
                Email *
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/50">
                Company
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/50">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-500/50"
              >
                <option value="USD">USD ($)</option>
                <option value="PHP">PHP (₱)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-md border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-semibold text-white">Line Items</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-sm text-white/50">
                <th className="pb-2 text-left">Description</th>
                <th className="pb-2 text-right" style={{ width: 100 }}>
                  Qty
                </th>
                <th className="pb-2 text-right" style={{ width: 150 }}>
                  Unit Price
                </th>
                <th className="pb-2 text-right" style={{ width: 150 }}>
                  Amount
                </th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, 'description', e.target.value)
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                      placeholder="Service description..."
                      required
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                      }
                      min="1"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-right text-white outline-none focus:border-cyan-500/50"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-right text-white outline-none focus:border-cyan-500/50"
                    />
                  </td>
                  <td className="py-2 text-right font-medium text-white">
                    {currency === 'USD' ? '$' : '₱'}
                    {item.amount.toLocaleString()}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-white/30 transition-colors hover:text-red-400"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center gap-2 text-sm text-cyan-400 transition-colors hover:text-cyan-300"
          >
            <Plus className="h-4 w-4" />
            Add Line Item
          </button>

          <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span>
                  {currency === 'USD' ? '$' : '₱'}
                  {subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Due Date & Notes */}
        <div className="rounded-md border border-white/10 bg-white/5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/50">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/50">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-2 mr-4">
            <input
              type="checkbox"
              id="sendOnCreate"
              checked={sendOnCreate}
              onChange={(e) => setSendOnCreate(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
            />
            <label htmlFor="sendOnCreate" className="text-sm text-white/70 cursor-pointer select-none">
              Send invoice via email immediately
            </label>
          </div>

          <Link
            href="/admin/invoices"
            className="rounded-md px-6 py-2 text-white/50 transition-colors hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-md bg-cyan-500/20 px-6 py-2 font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sendOnCreate ? 'Create & Send Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
