"use client";

/**
 * Availability Form
 * ------------------
 * Form for creating and editing availability slots.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const SLOT_TYPES = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "unavailable", label: "Unavailable" },
  { value: "tentative", label: "Tentative" },
];

interface AvailabilityFormProps {
  mode: "create" | "edit";
  defaultValues?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    note: string;
  };
  onSubmit: (data: any) => Promise<void>;
}

export function AvailabilityForm({ mode, defaultValues, onSubmit }: AvailabilityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: defaultValues?.date || new Date().toISOString().split("T")[0],
    startTime: defaultValues?.startTime || "09:00",
    endTime: defaultValues?.endTime || "17:00",
    type: defaultValues?.type || "available",
    note: defaultValues?.note || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit(form);
      if (mode === "create") {
        setForm({ date: new Date().toISOString().split("T")[0], startTime: "09:00", endTime: "17:00", type: "available", note: "" });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            {SLOT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">End Time</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1">Note (optional)</label>
        <input
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
          placeholder="e.g. Client meeting, internal review..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-medium text-white hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        {loading ? "Saving..." : mode === "create" ? "Add Slot" : "Save Changes"}
      </button>
    </form>
  );
}
