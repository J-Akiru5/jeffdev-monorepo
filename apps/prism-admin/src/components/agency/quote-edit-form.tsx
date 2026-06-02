"use client";

/**
 * Quote Edit Form
 * ----------------
 * Client component for editing a quote's status and details.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAgencyQuote } from "@/app/actions/agency-quotes";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "responded", label: "Responded" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
] as const;

const SCOPE_LABELS: Record<string, string> = {
  brand: "Basic Brand/UI Tweaks",
  api: "Custom API Integrations",
  features: "New Features on Top",
  full: "Full Custom Build",
};

interface QuoteEditFormProps {
  quoteId: string;
  defaultValues: {
    name: string;
    email: string;
    company: string;
    templateSelected: string;
    customizationScope: string;
    phone: string;
    requirements: string;
    status: string;
  };
}

export function QuoteEditForm({ quoteId, defaultValues }: QuoteEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(defaultValues);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await updateAgencyQuote(quoteId, {
      name: form.name,
      email: form.email,
      company: form.company,
      template_selected: form.templateSelected,
      customization_scope: form.customizationScope,
      phone: form.phone,
      description: form.requirements,
      status: form.status,
    });

    if (result.success) {
      router.push(`/admin/agency/quotes/${quoteId}`);
      router.refresh();
    } else {
      setError(result.error || "Failed to update quote");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Status */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: s.value }))}
              className={`rounded-sm px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                form.status === s.value
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-white/5 text-white/40 border-white/10 hover:text-white/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Company</label>
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* Template & Scope */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Template & Scope</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Selected Template</label>
            <input
              value={form.templateSelected}
              onChange={(e) => setForm((f) => ({ ...f, templateSelected: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Customization Scope</label>
            <select
              value={form.customizationScope}
              onChange={(e) => setForm((f) => ({ ...f, customizationScope: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Select scope...</option>
              {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Requirements</label>
          <textarea
            value={form.requirements}
            onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
