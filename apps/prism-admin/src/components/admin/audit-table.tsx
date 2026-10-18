"use client";

/**
 * AuditTable
 * ----------
 * Client component for the platform audit log viewer.
 * Handles filtering, pagination (load more), and rendering.
 */

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  Search,
  Filter,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import type { AuditEntry } from "@/app/actions/platform-audit";
import { getPlatformAuditLogs } from "@/app/actions/platform-audit";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  UPDATE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
  STATUS_CHANGE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const RESOURCE_LABELS: Record<string, string> = {
  services: "Services",
  projects: "Projects",
  quotes: "Quotes",
  messages: "Messages",
  calendar_events: "Calendar",
  invoices: "Invoices",
  subscriptions: "Subscriptions",
  users: "Users",
  feedback: "Feedback",
  case_study: "Case Studies",
  agency_availability: "Availability",
  contact_messages: "Contacts",
  site_settings: "Settings",
  blog_posts: "Blog",
};

const ACTION_OPTIONS = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"];
const RESOURCE_OPTIONS = Object.keys(RESOURCE_LABELS);

interface AuditTableProps {
  initialEntries: AuditEntry[];
  initialHasMore: boolean;
  initialNextCursor: string | null;
  currentFilters: {
    action?: string;
    resource?: string;
    actor?: string;
    search?: string;
  };
}

export function AuditTable({
  initialEntries,
  initialHasMore,
  initialNextCursor,
  currentFilters,
}: AuditTableProps) {
  const [entries, setEntries] = useState<AuditEntry[]>(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(currentFilters.search || "");
  const [actorInput, setActorInput] = useState(currentFilters.actor || "");

  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("cursor");
      router.push(`/admin/audit?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push("/admin/audit");
  }, [router]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilter("search", searchInput || undefined);
    },
    [searchInput, updateFilter],
  );

  const handleActorSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateFilter("actor", actorInput || undefined);
    },
    [actorInput, updateFilter],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const result = await getPlatformAuditLogs({
        action: searchParams.get("action") || undefined,
        resource: searchParams.get("resource") || undefined,
        actor: searchParams.get("actor") || undefined,
        search: searchParams.get("search") || undefined,
        cursor: nextCursor,
        limit: 50,
      });
      setEntries((prev) => [...prev, ...result.entries]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch {
      console.error("Failed to load more audit logs");
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading, searchParams]);

  const hasActiveFilters =
    currentFilters.action ||
    currentFilters.resource ||
    currentFilters.actor ||
    currentFilters.search;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by resource, action, or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </form>
        <form onSubmit={handleActorSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={actorInput}
            onChange={(e) => setActorInput(e.target.value)}
            placeholder="Filter by actor email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
            hasActiveFilters
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-lg border border-white/5 bg-white/[0.02]">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
              Action
            </label>
            <select
              value={currentFilters.action || ""}
              onChange={(e) => updateFilter("action", e.target.value || undefined)}
              className="block px-3 py-1.5 rounded border border-white/10 bg-white/[0.05] text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
              Resource
            </label>
            <select
              value={currentFilters.resource || ""}
              onChange={(e) =>
                updateFilter("resource", e.target.value || undefined)
              }
              className="block px-3 py-1.5 rounded border border-white/10 bg-white/[0.05] text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">All resources</option>
              {RESOURCE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {RESOURCE_LABELS[r] || r}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="self-end flex items-center gap-1 px-3 py-1.5 rounded text-xs text-white/50 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-white/30">
        {entries.length} event{entries.length !== 1 ? "s" : ""}
        {hasActiveFilters ? " (filtered)" : ""}
      </div>

      {/* Audit entries */}
      {entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-white/30">
          <Activity className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p>No audit logs found</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-xs text-amber-400 hover:text-amber-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const actionColor =
    ACTION_COLORS[entry.action] || "text-white/40 bg-white/10 border-white/10";
  const resourceLabel =
    RESOURCE_LABELS[entry.resourceType] || entry.resourceType;
  const ts = new Date(entry.timestamp);
  const timeStr = ts.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dateStr = ts.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const detailEntries = entry.details
    ? Object.entries(entry.details).filter(
        ([k]) => !["userEmail", "actorId", "actorRole"].includes(k),
      )
    : [];

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all">
      {/* Timestamp */}
      <div className="shrink-0 w-20 text-right">
        <p className="text-xs font-mono text-white/40">{timeStr}</p>
        <p className="text-[10px] text-white/25">{dateStr}</p>
      </div>

      {/* Action badge */}
      <div className="shrink-0">
        <span
          className={`inline-block rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-mono border ${actionColor}`}
        >
          {entry.action.replace("_", " ")}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-white/80">{resourceLabel}</span>
          {entry.resourceId && (
            <span className="text-[10px] font-mono text-white/30">
              {entry.resourceId.substring(0, 8)}
            </span>
          )}
        </div>

        {/* Actor */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/50">{entry.actorEmail}</span>
          {entry.actorRole && (
            <span className="text-[9px] font-mono text-white/30 bg-white/5 px-1 rounded">
              {entry.actorRole}
            </span>
          )}
        </div>

        {/* Details */}
        {detailEntries.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {detailEntries.slice(0, 4).map(([key, value]) => (
              <span key={key} className="text-[10px] text-white/30">
                <span className="text-white/20">{key}:</span>{" "}
                <span className="font-mono">
                  {typeof value === "string" && value.length > 40
                    ? value.substring(0, 40) + "..."
                    : String(value)}
                </span>
              </span>
            ))}
            {detailEntries.length > 4 && (
              <span className="text-[10px] text-white/20">
                +{detailEntries.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
