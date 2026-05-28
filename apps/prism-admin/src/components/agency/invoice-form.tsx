"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createAgencyInvoice } from "@/app/actions/agency-invoices";

/**
 * Invoice Form Component
 * -----------------------
 * Form for creating invoices for clients.
 */

interface Props {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

function createLineItem(existingItems: number): LineItem {
  return { id: `item-${Date.now()}-${existingItems}`, description: "", quantity: 1, unitPrice: 0, amount: 0 };
}

export function InvoiceForm({ mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    currency: "USD" as "USD" | "PHP",
    taxRate: 0,
    discount: 0,
    dueDate: "",
    notes: "",
    termsAndConditions: "",
  });

  const [items, setItems] = useState<LineItem[]>([createLineItem(0)]);

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.amount = updated.quantity * updated.unitPrice;
        }
        return updated;
      }),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, createLineItem(prev.length)]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = form.taxRate > 0 ? subtotal * form.taxRate : 0;
  const total = subtotal + tax - form.discount;
  const currencySymbol = form.currency === "PHP" ? "₱" : "$";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (items.length === 0 || items.every((i) => !i.description)) {
      setError("Add at least one line item");
      setLoading(false);
      return;
    }

    const result = await createAgencyInvoice({
      ...form,
      items: items.filter((i) => i.description),
      sendOnCreate: false,
    });

    if (result.success) {
      router.push("/admin/agency/invoices");
      router.refresh();
    } else {
      setError(result.error || "Failed to create invoice");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Client Info */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Client Name</label>
            <input
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Client Email</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Company (optional)</label>
          <input
            value={form.clientCompany}
            onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/80">Line Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  min={1}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="w-28">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="w-24 flex items-center justify-end text-sm text-white/70 font-mono pt-2">
                {currencySymbol}{item.amount.toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="pt-2 text-white/30 hover:text-red-400 transition-colors"
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-white/10 pt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Subtotal</span>
            <span className="text-white/70">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Tax ({(form.taxRate * 100).toFixed(0)}%)</span>
              <span className="text-white/70">{currencySymbol}{tax.toFixed(2)}</span>
            </div>
          )}
          {form.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Discount</span>
              <span className="text-red-400">-{currencySymbol}{form.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-medium pt-1 border-t border-white/10">
            <span className="text-white/60">Total</span>
            <span className="text-white font-bold">{currencySymbol}{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as "USD" | "PHP" }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="USD">USD ($)</option>
              <option value="PHP">PHP (₱)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              value={form.taxRate * 100}
              onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) / 100 }))}
              min={0}
              max={100}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Discount ($)</label>
          <input
            type="number"
            value={form.discount}
            onChange={(e) => setForm((f) => ({ ...f, discount: Number(e.target.value) }))}
            min={0}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white/10 px-6 py-2.5 text-sm text-white hover:bg-white/15 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : "Create Invoice"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2.5 text-sm text-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
