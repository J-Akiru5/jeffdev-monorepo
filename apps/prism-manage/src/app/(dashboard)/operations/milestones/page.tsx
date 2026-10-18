"use client";

/**
 * Milestone Management (/operations/milestones)
 * ---------------------------------------------
 * CRUD for company milestones — CEO/COO only.
 */

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { OperationsGuard } from "@/components/operations-guard";
import { ConfirmDialog } from "@syntaxure/ui";
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  updateMilestone,
  type Milestone,
  type MilestoneStatus,
} from "@/app/actions/operations";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-white/10 text-white/50",
  in_progress: "bg-cyan-500/15 text-cyan-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  blocked: "bg-rose-500/15 text-rose-400",
};

const inputClass =
  "w-full rounded-lg border border-border bg-glass-04 px-3 py-2 text-sm text-white/70 outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50";

export default function MilestonesPage() {
  return (
    <OperationsGuard mode="operations">
      <MilestonesManager />
    </OperationsGuard>
  );
}

function MilestonesManager() {
  const departments = useWorkspaceStore((s) => s.departments);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Milestone | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<MilestoneStatus>("pending");
  const [departmentId, setDepartmentId] = useState("");
  const [deliverables, setDeliverables] = useState("");

  const load = useCallback(async () => {
    const data = await getMilestones();
    setMilestones(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setStatus("pending");
    setDepartmentId("");
    setDeliverables("");
  };

  const startEdit = (m: Milestone) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDescription(m.description || "");
    setDueDate(m.dueDate || "");
    setStatus(m.status);
    setDepartmentId(m.departmentId || "");
    setDeliverables(m.deliverables.join(", "));
  };

  const handleSubmit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        status,
        departmentId: departmentId || null,
        deliverables: deliverables
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      };

      const result = editingId
        ? await updateMilestone(editingId, payload)
        : await createMilestone(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editingId ? "Milestone updated" : "Milestone created");
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (m: Milestone) => {
    setPendingDelete(m);
  };

  const executeDelete = async () => {
    const m = pendingDelete;
    setPendingDelete(null);
    if (!m) return;
    const result = await deleteMilestone(m.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Milestone deleted");
    await load();
  };

  const departmentName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name || "—" : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Milestones</h1>
        <p className="mt-1 text-sm text-white/40">
          Track company milestones with status, deliverables, and due dates.
        </p>
      </div>

      {/* Form */}
      <div className="mb-6 rounded-xl border border-border glass-subtle p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            {editingId ? "Edit milestone" : "New milestone"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
            >
              <X className="h-3 w-3" />
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone title"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-white/40">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-white/40">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-white/40">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-white/40">
              Deliverables (comma-separated)
            </label>
            <input
              type="text"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="e.g. Spec, Beta, Launch"
              className={inputClass}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || saving}
          className="mt-3 flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Saving…" : editingId ? "Save Changes" : "Add Milestone"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {milestones.length === 0 && (
          <p className="py-8 text-center text-sm text-white/30">
            No milestones yet — add the first one above.
          </p>
        )}
        {milestones.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-border glass-subtle px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-white/80">
                  {m.title}
                </p>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[m.status]}`}
                >
                  {STATUS_OPTIONS.find((o) => o.value === m.status)?.label || m.status}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] font-mono text-white/30">
                {m.dueDate ? `Due ${m.dueDate}` : "No due date"} ·{" "}
                {departmentName(m.departmentId)}
                {m.deliverables.length > 0
                  ? ` · ${m.deliverables.length} deliverable${m.deliverables.length === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
            <button
              onClick={() => startEdit(m)}
              className="rounded p-1.5 text-white/30 transition-colors hover:text-white/70"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(m)}
              className="rounded p-1.5 text-white/30 transition-colors hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={() => setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title || "milestone"}"?`}
        description="This removes the milestone and its deliverables list."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={executeDelete}
      />
    </div>
  );
}
