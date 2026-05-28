"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Circle, Loader2, Trash2 } from "lucide-react";
import {
  addAgencyMilestone,
  updateAgencyMilestoneStatus,
  deleteAgencyMilestone,
} from "@/app/actions/agency-projects";

/**
 * Milestones List Component
 * --------------------------
 * Displays and manages milestones for a project.
 */

interface Milestone {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  deliverables?: string[];
}

const statusColors: Record<string, string> = {
  pending: "text-white/30",
  in_progress: "text-cyan-400",
  completed: "text-emerald-400",
  blocked: "text-red-400",
};

export function MilestonesList({ slug }: { slug: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMilestones() {
      try {
        const res = await fetch(`/api/agency/projects/${slug}/milestones`);
        const data = await res.json();
        if (data.milestones) setMilestones(data.milestones);
      } catch (err) {
        console.error("Failed to load milestones:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMilestones();
  }, [slug]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    setError("");
    const result = await addAgencyMilestone(slug, {
      title: newTitle.trim(),
      description: newDescription || undefined,
      due_date: newDueDate,
    });

    if (result.success && result.milestone) {
      setMilestones((prev) => [...prev, result.milestone as Milestone]);
      setNewTitle("");
      setNewDueDate("");
      setNewDescription("");
      setShowForm(false);
    } else {
      setError(result.error || "Failed to add milestone");
    }
  }

  async function handleToggleStatus(milestone: Milestone) {
    const nextStatus =
      milestone.status === "completed" ? "in_progress" : "completed";
    const result = await updateAgencyMilestoneStatus(slug, milestone.id, nextStatus);
    if (result.success) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestone.id ? { ...m, status: nextStatus as Milestone["status"] } : m)),
      );
    }
  }

  async function handleDelete(milestoneId: string) {
    if (!confirm("Delete this milestone?")) return;
    const result = await deleteAgencyMilestone(slug, milestoneId);
    if (result.success) {
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80">Milestones</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Milestone
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Milestone title"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            required
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            required
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md px-3 py-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <p className="text-xs text-white/30 py-4 text-center">No milestones yet</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-3 hover:border-white/10 transition-all group"
            >
              <button
                onClick={() => handleToggleStatus(milestone)}
                className="mt-0.5 shrink-0"
              >
                {milestone.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Circle className={`h-4 w-4 ${statusColors[milestone.status] || "text-white/30"}`} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    milestone.status === "completed"
                      ? "text-white/40 line-through"
                      : "text-white/80"
                  }`}
                >
                  {milestone.title}
                </p>
                {milestone.description && (
                  <p className="text-xs text-white/40 mt-0.5">{milestone.description}</p>
                )}
                <p className="text-[10px] text-white/30 mt-1">
                  Due: {new Date(milestone.due_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(milestone.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
