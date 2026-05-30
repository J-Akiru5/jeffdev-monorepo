"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAgencyService, updateAgencyService } from "@/app/actions/agency-services";
import type { ServiceFormData } from "@/app/actions/agency-services";

interface Props {
  mode: "create" | "edit";
  serviceId?: string;
  defaultValues?: Partial<ServiceFormData>;
}

export function ServiceForm({ mode, serviceId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: defaultValues?.name || "",
    category: defaultValues?.category || "web",
    description: defaultValues?.description || "",
    priceMin: defaultValues?.priceMin ?? null,
    priceMax: defaultValues?.priceMax ?? null,
    status: defaultValues?.status || "active" as const,
    billingStructure: defaultValues?.billingStructure || "one-time" as const,
    forcesCustomQuote: defaultValues?.forcesCustomQuote || false,
    coverImage: defaultValues?.coverImage || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data: ServiceFormData = {
      name: form.name,
      category: form.category,
      description: form.description,
      priceMin: form.priceMin === null || form.priceMin === undefined ? null : Number(form.priceMin),
      priceMax: form.priceMax === null || form.priceMax === undefined ? null : Number(form.priceMax),
      status: form.status,
      billingStructure: form.billingStructure,
      forcesCustomQuote: form.forcesCustomQuote,
      coverImage: form.coverImage || null,
    };

    const result =
      mode === "edit" && serviceId
        ? await updateAgencyService(serviceId, data)
        : await createAgencyService(data);

    if (result.success) {
      router.push("/admin/agency/services");
      router.refresh();
    } else {
      setError(result.error || "Operation failed");
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

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Basic Info</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Service Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
              placeholder="e.g. Enterprise Web App Packaging"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="web" className="bg-[#030303]">Web Development</option>
              <option value="saas" className="bg-[#030303]">SaaS Platform</option>
              <option value="ai" className="bg-[#030303]">AI Integration</option>
              <option value="cloud" className="bg-[#030303]">Cloud Infrastructure</option>
              <option value="mobile" className="bg-[#030303]">Mobile App</option>
              <option value="design" className="bg-[#030303]">Design System</option>
              <option value="consulting" className="bg-[#030303]">Consulting</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full h-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            placeholder="Describe the scope, deliverables, and parameters of the service..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Minimum Investment (USD)</label>
            <input
              type="number"
              value={form.priceMin === null ? "" : form.priceMin}
              onChange={(e) => setForm((f) => ({ ...f, priceMin: e.target.value === "" ? null : Number(e.target.value) }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 font-mono"
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Maximum Investment (USD)</label>
            <input
              type="number"
              value={form.priceMax === null ? "" : form.priceMax}
              onChange={(e) => setForm((f) => ({ ...f, priceMax: e.target.value === "" ? null : Number(e.target.value) }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 font-mono"
              placeholder="Leave blank if variable"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Billing & Packaging Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Billing Structure</label>
            <select
              value={form.billingStructure}
              onChange={(e) => setForm((f) => ({ ...f, billingStructure: e.target.value as any }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="one-time" className="bg-[#030303]">One-Time Flat Fee</option>
              <option value="recurring" className="bg-[#030303]">Recurring Subscription</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Catalog Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="active" className="bg-[#030303]">Active</option>
              <option value="inactive" className="bg-[#030303]">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <input
            type="checkbox"
            id="forcesCustomQuote"
            checked={form.forcesCustomQuote}
            onChange={(e) => setForm((f) => ({ ...f, forcesCustomQuote: e.target.checked }))}
            className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-cyan-600 focus:ring-cyan-500/50"
          />
          <div>
            <label htmlFor="forcesCustomQuote" className="block text-sm font-medium text-white/80">
              Forces Custom Quote
            </label>
            <p className="text-xs text-white/40 mt-0.5">
              If enabled, users cannot buy this directly via the payment gateway. They will be directed to book a call for a quotation instead.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Cover Image URL</label>
          <input
            type="url"
            value={form.coverImage}
            onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 font-mono"
            placeholder="https://example.com/images/cover.jpg"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/agency/services")}
          className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "Saving..." : mode === "create" ? "Create Service" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
