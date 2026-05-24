"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Star,
  StarOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { SlotInput } from "@/app/actions/availability";

interface AvailabilitySlot {
  id: string;
  quarter_label: string;
  total_slots: number;
  filled_slots: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  initialSlots: AvailabilitySlot[];
  saveAction: (
    input: SlotInput,
  ) => Promise<{ success: boolean; error?: string }>;
  setActiveAction: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function AvailabilityManager({
  initialSlots,
  saveAction,
  setActiveAction,
  deleteAction,
}: Props) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState({
    quarterLabel: "",
    totalSlots: 3,
    filledSlots: 0,
    isActive: false,
  });

  const activeSlot = slots.find((s) => s.is_active);
  const remaining = activeSlot
    ? activeSlot.total_slots - activeSlot.filled_slots
    : 0;

  function resetForm() {
    setForm({
      quarterLabel: "",
      totalSlots: 3,
      filledSlots: 0,
      isActive: false,
    });
    setEditingSlot(null);
    setShowForm(false);
  }

  function startEdit(slot: AvailabilitySlot) {
    setEditingSlot(slot);
    setForm({
      quarterLabel: slot.quarter_label,
      totalSlots: slot.total_slots,
      filledSlots: slot.filled_slots,
      isActive: slot.is_active,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = await saveAction({
      id: editingSlot?.id,
      quarterLabel: form.quarterLabel,
      totalSlots: form.totalSlots,
      filledSlots: form.filledSlots,
      isActive: form.isActive,
    });

    if (result.success) {
      setMessage({
        type: "success",
        text: editingSlot ? "Slot updated" : "Slot created",
      });
      resetForm();

      const { data } = await refreshSlots();
      if (data) setSlots(data);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to save" });
    }
  }

  async function handleSetActive(id: string) {
    const result = await setActiveAction(id);
    if (result.success) {
      setSlots((prev) =>
        prev.map((s) => ({
          ...s,
          is_active: s.id === id,
        })),
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quarter?")) return;
    const result = await deleteAction(id);
    if (result.success) {
      setSlots((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function handleQuickAdjust(id: string, direction: 1 | -1) {
    const slot = slots.find((s) => s.id === id);
    if (!slot) return;

    const newFilled = slot.filled_slots + direction;
    if (newFilled < 0 || newFilled > slot.total_slots) return;

    const result = await saveAction({
      id: slot.id,
      quarterLabel: slot.quarter_label,
      totalSlots: slot.total_slots,
      filledSlots: newFilled,
      isActive: slot.is_active,
    });

    if (result.success) {
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, filled_slots: newFilled } : s)),
      );
    }
  }

  async function refreshSlots() {
    const { getAvailabilitySlots } = await import("@/app/actions/availability");
    return getAvailabilitySlots();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Availability</h1>
          <p className="text-sm text-white/50">
            Manage agency project slots per quarter
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
        >
          {showForm ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {showForm ? "Cancel" : "Add Quarter"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
        >
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-white">
            {editingSlot ? "Edit Quarter" : "New Quarter"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Quarter Label
              </label>
              <input
                type="text"
                value={form.quarterLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quarterLabel: e.target.value }))
                }
                placeholder="Q3 2026"
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Total Slots
              </label>
              <input
                type="number"
                min={0}
                value={form.totalSlots}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    totalSlots: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Filled Slots
              </label>
              <input
                type="number"
                min={0}
                value={form.filledSlots}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    filledSlots: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="rounded border-white/20 bg-white/5"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
            >
              {editingSlot ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active Quarter Banner */}
      {activeSlot && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="font-mono text-xs text-emerald-400">
                {remaining} of {activeSlot.total_slots} slots available for{" "}
                {activeSlot.quarter_label}
              </p>
              <p className="text-xs text-emerald-400/60 mt-0.5">
                This is shown on the public website
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quarters Table */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Quarter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Filled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-white/30"
                  >
                    No quarters defined yet. Add one to start tracking
                    availability.
                  </td>
                </tr>
              )}
              {slots.map((slot) => {
                const rem = slot.total_slots - slot.filled_slots;
                const isFull = rem <= 0;

                return (
                  <tr
                    key={slot.id}
                    className={`border-b border-white/[0.04] ${slot.is_active ? "bg-emerald-500/[0.02]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-white">
                        {slot.quarter_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70">
                      {slot.total_slots}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70">
                      {slot.filled_slots}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${isFull ? "text-red-400" : "text-emerald-400"}`}
                      >
                        {rem}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {slot.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                          <Star className="h-3 w-3 fill-current" />
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleQuickAdjust(slot.id, -1)}
                          disabled={slot.filled_slots <= 0}
                          className="rounded p-1.5 text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Unfill slot"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(slot.id, 1)}
                          disabled={slot.filled_slots >= slot.total_slots}
                          className="rounded p-1.5 text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Fill slot"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        {!slot.is_active && (
                          <button
                            onClick={() => handleSetActive(slot.id)}
                            className="rounded p-1.5 text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Set as active"
                          >
                            <StarOff className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(slot)}
                          className="rounded p-1.5 text-white/30 hover:text-white hover:bg-white/5 transition-colors text-xs"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="rounded p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
