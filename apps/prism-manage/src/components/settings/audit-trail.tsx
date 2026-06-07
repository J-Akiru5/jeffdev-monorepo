"use client";

/**
 * Audit Trail Section
 * --------------------
 * Displays recent audit log entries in a timeline-style list.
 * Only shown for founders in Workspace mode.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  History,
  Shield,
  Trash2,
  Edit3,
  PlusCircle,
  RefreshCw,
  ToggleLeft,
  Loader2,
  ChevronDown,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import { getAuditLogs, type AuditLogEntry } from "@/app/actions/audit";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useManageModeStore } from "@/stores/manage-mode-store";

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CREATE: { label: "Created", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: PlusCircle },
  UPDATE: { label: "Updated", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Edit3 },
  DELETE: { label: "Deleted", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: Trash2 },
  STATUS_CHANGE: { label: "Status Changed", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: RefreshCw },
  TOGGLE: { label: "Toggled", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: ToggleLeft },
};

const RESOURCE_LABELS: Record<string, string> = {
  tasks: "Task",
  projects: "Project",
  workspace_members: "Member",
  members: "Member",
  manage_mode: "Mode",
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const logDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  if (diffDays < 14) return "Last Week";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function shortenResourceId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function formatChanges(changes: Record<string, unknown> | null): string {
  if (!changes) return "";
  const entries = Object.entries(changes).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return "";
  return entries
    .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : String(val)}`)
    .join(", ");
}

type FlatLogItem =
  | { type: "header"; label: string }
  | { type: "log"; log: AuditLogEntry };

export function AuditTrailSection() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const userRole = useWorkspaceStore((s) => s.userRole);
  const manageMode = useManageModeStore((s) => s.mode);
  const isFounder = userRole === "founder";
  const canViewAudit = isFounder && manageMode === "workspace";

  const PAGE_SIZE = 30;

  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        setLoading(true);
        setError(null);
        const result = await getAuditLogs({ limit: PAGE_SIZE, offset: 0 });
        if (!mounted) return;
        setLogs(result.logs);
        setTotal(result.total);
        setOffset(result.logs.length);
      } catch {
        if (!mounted) return;
        setError("Failed to load audit logs");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();
    return () => { mounted = false; };
  }, [refreshKey]);

  async function loadMore() {
    try {
      setLoadingMore(true);
      setError(null);
      const currentOffset = offset;
      const result = await getAuditLogs({ limit: PAGE_SIZE, offset: currentOffset });
      setLogs((prev) => [...prev, ...result.logs]);
      setTotal(result.total);
      setOffset(currentOffset + result.logs.length);
    } catch {
      setError("Failed to load more audit logs");
    } finally {
      setLoadingMore(false);
    }
  }

  function refresh() {
    setLogs([]);
    setOffset(0);
    setTotal(0);
    setRefreshKey((k) => k + 1);
  }

  // Group logs by date (memoized)
  const groupedLogs = useMemo(() => {
    const map: Record<string, AuditLogEntry[]> = {};
    for (const log of logs) {
      const group = formatDateGroup(log.createdAt);
      if (!map[group]) map[group] = [];
      map[group].push(log);
    }
    return map;
  }, [logs]);

  // Flatten grouped logs into a single array for virtualization
  const flatItems = useMemo<FlatLogItem[]>(() => {
    const items: FlatLogItem[] = [];
    for (const [group, groupLogs] of Object.entries(groupedLogs)) {
      items.push({ type: "header", label: group });
      for (const log of groupLogs) {
        items.push({ type: "log", log });
      }
    }
    return items;
  }, [groupedLogs]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = flatItems[index];
      return item?.type === "header" ? 36 : 56;
    },
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 5,
  });

  // If not a founder or not in Workspace mode, show a message
  if (!isFounder) {
    return null; // Hide section entirely for non-founders
  }

  if (!canViewAudit) {
    return (
      <section className="rounded-xl border border-glass-10 glass-subtle p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-amber-500/10 p-3">
            <History className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Audit Trail</h2>
            <p className="mt-1 text-sm text-white/40">
              <GitBranch className="inline h-3 w-3 mr-1" />
              Switch to <strong>Workspace</strong> mode to view the audit trail
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-glass-10 glass-subtle p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-rose-500/10 p-3">
          <History className="h-6 w-6 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Audit Trail</h2>
              <p className="mt-1 text-sm text-white/40">
                Recent actions and changes across the workspace
                {total > 0 && (
                  <span className="ml-2 text-xs text-white/30">
                    ({total} total entries)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="flex-shrink-0 rounded-lg border border-glass-10 bg-white/[0.02] p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50"
              title="Refresh audit logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading && logs.length === 0 ? (
            <div className="mt-6 flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
              <span className="ml-2 text-sm text-white/30">Loading audit trail…</span>
            </div>
          ) : error ? (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={refresh}
                className="ml-auto rounded-md border border-red-500/20 px-3 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="mt-6 rounded-lg border border-glass-10 bg-white/[0.02] p-8 text-center">
              <History className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-3 text-sm text-white/40">No audit logs yet.</p>
              <p className="mt-1 text-xs text-white/30">
                Actions like creating tasks, managing members, and toggling modes will appear here.
              </p>
            </div>
          ) : (            <div ref={parentRef} className="mt-6 max-h-[65vh] overflow-auto" style={{ contain: "layout paint" }}>
              {/* Virtualized Timeline */}
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: "relative",
                  width: "100%",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = flatItems[virtualRow.index];
                  if (!item) return null;

                  if (item.type === "header") {
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 px-3 py-2">
                          {item.label}
                        </h3>
                      </div>
                    );
                  }

                  const log = item.log;
                  const config = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    color: "text-white/40 bg-white/[0.04] border-white/[0.06]",
                    icon: Shield,
                  };
                  const ActionIcon = config.icon;
                  const resourceLabel =
                    RESOURCE_LABELS[log.resourceType] ||
                    log.resourceType
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  const changeSummary = formatChanges(log.changes);

                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-glass-10 hover:bg-white/[0.02]"
                    >
                      {/* Action Badge */}
                      <span
                        className={`flex-shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${config.color}`}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {config.label}
                      </span>

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white/80">
                          <span className="font-medium text-white/90">
                            {resourceLabel}
                          </span>
                          {log.resourceId && (
                            <code className="ml-1.5 rounded bg-white/[0.06] px-1 py-0.5 text-[11px] font-mono text-white/50">
                              {shortenResourceId(log.resourceId)}
                            </code>
                          )}
                        </span>
                        {changeSummary && (
                          <p className="mt-0.5 text-xs text-white/40 truncate max-w-md">
                            {changeSummary}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <time
                        dateTime={log.createdAt}
                        className="flex-shrink-0 text-xs text-white/30 group-hover:text-white/50 transition-colors"
                        title={new Date(log.createdAt).toLocaleString()}
                      >
                        {formatRelativeTime(log.createdAt)}
                      </time>
                    </div>
                  );
                })}
              </div>

              {/* Load More — inside scroll container so it appears at the bottom of the virtual list */}
              {logs.length < total && (
                <div className="py-4 text-center">
                  <button
                    onClick={() => loadMore()}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-lg border border-glass-10 bg-white/[0.02] px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    Load more ({total - logs.length} remaining)
                  </button>
                </div>
              )}
            </div>
          )
        }
        </div>
      </div>
    </section>
  );
}
