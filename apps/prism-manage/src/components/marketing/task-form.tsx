"use client";

import { useState, useCallback } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createMarketingTask } from "@/app/actions/marketing";
import type { MarketingTeamMember } from "@/lib/schemas";

const PHASES = [
  { value: "phase-1", label: "Phase 1 — Foundation" },
  { value: "phase-2", label: "Phase 2 — Authority" },
  { value: "phase-3", label: "Phase 3 — Launch" },
  { value: "ongoing", label: "Ongoing" },
];

const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PLATFORMS = [
  { value: "", label: "— None —" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter/X" },
  { value: "YouTube", label: "YouTube" },
  { value: "Blog", label: "Blog" },
  { value: "Website", label: "Website" },
  { value: "Discord", label: "Discord" },
  { value: "GitHub", label: "GitHub" },
];

export function TaskForm({ team }: { team: MarketingTeamMember[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("phase-1");
  const [priority, setPriority] = useState("high");
  const [platform, setPlatform] = useState("");
  const [selectedOwners, setSelectedOwners] = useState<string[]>(
    team.length > 0 ? [team[0]!.id] : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleOwner = useCallback((id: string) => {
    setSelectedOwners((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      if (selectedOwners.length === 0) {
        setError("Assign at least one owner");
        return;
      }

      setSubmitting(true);
      setError("");
      try {
        await createMarketingTask({
          title: title.trim(),
          description: description.trim() || undefined,
          phaseId: phase,
          priority,
          ownerIds: selectedOwners,
          platform: platform || undefined,
        });
        setOpen(false);
        setTitle("");
        setDescription("");
        setPhase("phase-1");
        setPriority("high");
        setPlatform("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
      }
      setSubmitting(false);
    },
    [title, description, phase, priority, platform, selectedOwners]
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-all hover:border-cyan-500/40"
      >
        <Plus className="h-4 w-4" />
        New Task
      </button>
    );
  }

  return (
    <div className="glass rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">New Marketing Task</h3>
        <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details..."
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
              Phase
            </label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
            >
              {PHASES.map((p) => (
                <option key={p.value} value={p.value} className="bg-black">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value} className="bg-black">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value} className="bg-black">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
            Owners
          </label>
          <div className="flex flex-wrap gap-2">
            {team.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleOwner(member.id)}
                className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded border transition-all ${
                  selectedOwners.includes(member.id)
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-400"
                    : "border-white/20 text-white/50 hover:border-white/40"
                }`}
              >
                {member.initials}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-black py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
}
