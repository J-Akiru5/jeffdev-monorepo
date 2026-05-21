"use client";

import { useState } from "react";
import { Trash2, Power, ExternalLink } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RuleItem {
  id: string;
  name: string;
  category: string;
  priority: number;
  isActive: boolean;
  content: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RuleCard
// ─────────────────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: number }) {
  if (priority <= 3) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
        HIGH
      </span>
    );
  }
  if (priority <= 7) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
        MED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white/5 text-white/40 border border-white/10">
      LOW
    </span>
  );
}

function RuleCard({
  rule,
  onDelete,
  onToggle,
}: {
  rule: RuleItem;
  onDelete: (id: string) => void;
  onToggle: (id: string, next: boolean) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isActive, setIsActive] = useState(rule.isActive);

  const handleToggle = async () => {
    const next = !isActive;
    setIsActive(next); // optimistic
    setToggling(true);
    try {
      const res = await fetch(`/api/v1/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        setIsActive(!next); // rollback
      } else {
        onToggle(rule.id, next);
      }
    } catch {
      setIsActive(!next); // rollback
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/rules/${rule.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(rule.id);
      }
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`group rounded-md border bg-white/[0.02] p-4 transition-all ${
        isActive
          ? "border-white/[0.07] hover:border-white/[0.12]"
          : "border-white/[0.03] opacity-50 hover:opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-white truncate">{rule.name}</p>
            <PriorityBadge priority={rule.priority} />
          </div>
          <p className="text-xs text-white/40 mt-1 truncate">
            {rule.category} · Priority {rule.priority}
          </p>
          {rule.content && (
            <p className="text-xs text-white/25 mt-1.5 line-clamp-2 leading-relaxed">
              {rule.content.slice(0, 120)}{rule.content.length > 120 ? "…" : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Active toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={isActive ? "Deactivate rule" : "Activate rule"}
            className={`p-1.5 rounded transition-colors ${
              isActive
                ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                : "text-white/20 hover:text-white/50 hover:bg-white/5"
            } disabled:opacity-50`}
          >
            <Power className="h-3.5 w-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete rule"
            className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* ID */}
          <span className="font-mono text-[10px] text-white/20 ml-1">
            #{rule.id.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RulesList (stateful wrapper)
// ─────────────────────────────────────────────────────────────────────────────

export function RulesList({
  rules: initialRules,
  projectSlug,
}: {
  rules: RuleItem[];
  projectSlug: string;
}) {
  const [rules, setRules] = useState<RuleItem[]>(initialRules);

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggle = (id: string, next: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: next } : r)));
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white">
          📜 Project Rules
          {rules.length > 0 && (
            <span className="ml-2 text-xs text-white/30">
              {activeCount}/{rules.length} active
            </span>
          )}
        </h2>
        <Link
          href={`/projects/${projectSlug}/rules/new`}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          + Add Rule
        </Link>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-md border border-white/5 bg-white/[0.01] p-8 text-center">
          <p className="text-sm text-white/40">
            No rules yet. Upload a video or create rules manually.
          </p>
          <Link
            href={`/projects/${projectSlug}/rules/new`}
            className="inline-flex items-center gap-1 mt-3 text-xs text-cyan-400 hover:text-cyan-300"
          >
            Create your first rule
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
