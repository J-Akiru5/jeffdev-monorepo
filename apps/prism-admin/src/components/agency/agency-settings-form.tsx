"use client";

/**
 * Agency Settings Page (Form)
 * ----------------------------
 * Real settings form for agency configuration.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { getAgencySettings, saveAgencySettings, type AgencySettings } from "@/app/actions/agency-settings";

export default function AgencySettingsPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<AgencySettings>({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    businessDescription: "",
    primaryColor: "#f59e0b",
    logoUrl: "",
    invoicePrefix: "INV-",
    taxRate: "0",
  });

  useEffect(() => {
    (async () => {
      const result = await getAgencySettings();
      if (result.success && result.data) {
        setForm(result.data);
      }
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const result = await saveAgencySettings(form);
    if (result.success) {
      setSuccess("Settings saved successfully");
      router.refresh();
    } else {
      setError(result.error || "Failed to save settings");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">Configure your agency settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Business Info */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-medium text-white/80">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Business Name</label>
              <input
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                placeholder="Syntaxure Labs"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Business Email</label>
              <input
                type="email"
                value={form.businessEmail}
                onChange={(e) => setForm((f) => ({ ...f, businessEmail: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                placeholder="hello@syntaxure.dev"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Phone</label>
              <input
                value={form.businessPhone}
                onChange={(e) => setForm((f) => ({ ...f, businessPhone: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                placeholder="+63 917 123 4567"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Invoice Prefix</label>
              <input
                value={form.invoicePrefix}
                onChange={(e) => setForm((f) => ({ ...f, invoicePrefix: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                placeholder="INV-"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Address</label>
              <input
                value={form.businessAddress}
                onChange={(e) => setForm((f) => ({ ...f, businessAddress: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                placeholder="Business address"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Description</label>
              <textarea
                value={form.businessDescription}
                onChange={(e) => setForm((f) => ({ ...f, businessDescription: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 resize-none"
                placeholder="Brief description of your agency..."
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-medium text-white/80">Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="h-8 w-8 rounded border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Logo URL</label>
              <input
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Tax */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-medium text-white/80">Financial</h3>
          <div>
            <label className="block text-xs text-white/50 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.taxRate}
              onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
              className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
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
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-medium text-white hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
