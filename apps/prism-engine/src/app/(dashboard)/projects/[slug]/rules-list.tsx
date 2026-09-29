"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Power, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  distinctCategories,
  filterRules,
  groupRulesByCategory,
  normalizeSeverity,
  type Severity,
} from "@/lib/rule-list-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RuleItem {
  id: string;
  name: string;
  category: string;
  severity: string;
  priority: number;
  isActive: boolean;
  content: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chips
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<Severity, string> = {
  error: "bg-red-500/15 text-red-400 border-red-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

function SeverityChip({ severity }: { severity: string }) {
  const value = normalizeSeverity(severity);
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold ${SEVERITY_STYLES[value]}`}
    >
      {value}
    </span>
  );
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/50">
      {category}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RuleRow — one-line, expands to the full instruction
// ─────────────────────────────────────────────────────────────────────────────

function RuleRow({
  rule,
  onDelete,
  onToggle,
}: {
  rule: RuleItem;
  onDelete: (id: string) => void;
  onToggle: (id: string, next: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
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
      className={`group rounded-md border bg-white/[0.02] transition-colors ${
        isActive
          ? "border-white/[0.07] hover:border-white/[0.12]"
          : "border-white/[0.03] opacity-50 hover:opacity-70"
      }`}
    >
      {/* One-line summary row */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          title={expanded ? "Collapse instruction" : "Expand instruction"}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 flex-shrink-0 text-white/30 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
          <span className="truncate text-sm text-white">{rule.name}</span>
          <span className="hidden flex-shrink-0 sm:inline-flex">
            <CategoryChip category={rule.category} />
          </span>
        </button>

        {/* Actions — toggle/delete behavior unchanged */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <SeverityChip severity={rule.severity} />
          <span className="font-mono text-[10px] text-white/30">
            p{rule.priority}
          </span>
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
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete rule"
            className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <span className="ml-1 hidden font-mono text-[10px] text-white/20 md:inline">
            #{rule.id.slice(-4)}
          </span>
        </div>
      </div>

      {/* Expanded: full instruction */}
      {expanded && (
        <div className="border-t border-white/[0.05] px-3 py-2.5">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/50">
            {rule.content || "(no instruction)"}
          </p>
          <p className="mt-1.5 font-mono text-[10px] text-white/20">
            {rule.id}
          </p>
        </div>
      )}
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggle = (id: string, next: boolean) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: next } : r)),
    );
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  const categories = useMemo(() => distinctCategories(rules), [rules]);
  const filtered = useMemo(
    () => filterRules(rules, query, category === "all" ? null : category),
    [rules, query, category],
  );
  const groups = useMemo(() => groupRulesByCategory(filtered), [filtered]);
  const filtering = query.trim() !== "" || category !== "all";

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
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectSlug}/rules/templates`}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Browse Templates
          </Link>
          <Link
            href={`/projects/${projectSlug}/rules/new`}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            + Add Rule
          </Link>
        </div>
      </div>

      {/* Search + category filter */}
      {rules.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rules…"
              className="w-full rounded-md border border-white/10 bg-white/[0.02] py-1.5 pl-8 pr-2.5 text-xs text-white placeholder:text-white/25 focus:border-cyan-500/40 focus:outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1.5 text-xs text-white/70 focus:border-cyan-500/40 focus:outline-none"
          >
            <option value="all" className="bg-[#0b0e14]">
              All categories
            </option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#0b0e14]">
                {c}
              </option>
            ))}
          </select>
          {filtering && (
            <span className="flex-shrink-0 font-mono text-[10px] text-white/30">
              {filtered.length}/{rules.length}
            </span>
          )}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="rounded-md border border-white/5 bg-white/[0.01] p-8 text-center">
          <p className="text-sm text-white/40">
            No rules yet. Upload a video or create rules manually.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link
              href={`/projects/${projectSlug}/rules/templates`}
              className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
            >
              Browse templates
            </Link>
            <Link
              href={`/projects/${projectSlug}/rules/new`}
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              Create your first rule
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-white/5 bg-white/[0.01] p-6 text-center">
          <p className="text-xs text-white/40">
            No rules match the current search/filter.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ category: cat, rules: items }) => (
            <div key={cat}>
              <h3 className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
                {cat}
                <span className="font-mono text-white/25">{items.length}</span>
              </h3>
              <div className="space-y-1.5">
                {items.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
