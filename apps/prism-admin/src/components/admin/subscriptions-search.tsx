"use client";

/**
 * SubscriptionsSearch
 * --------------------
 * Client wrapper that adds URL-persisted search/filter state to the
 * subscriptions table. Wraps the subscriptions content so users can
 * search by email/ID and filter by status, with state synced to URL.
 *
 * The internal SubscriptionsSearchContent component uses useSearchParams
 * and must be wrapped in <Suspense>. Use the exported SubscriptionsSearch
 * wrapper (which includes Suspense) in server component pages.
 */

import { useDebouncedValue } from "@syntaxure/ui";
import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Subscription {
  id: string;
  user_id: string;
  user_email?: string;
  plan?: string;
  status: string;
  amount?: number;
  current_period_end?: string;
  created_at?: string;
}

/** @internal Use SubscriptionsSearch wrapper instead (provides Suspense boundary) */
function SubscriptionsSearchContent({
  subscriptions: initialSubs,
}: {
  subscriptions: Subscription[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || "",
  );
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string | null>(
    () => searchParams.get("status") || null,
  );
  const [currentPage, setCurrentPage] = useState(
    () => Number(searchParams.get("page")) || 1,
  );

  const PAGE_SIZE = 15;

  // Compute stats
  const stats = useMemo(() => {
    const active = initialSubs.filter((s) => s.status === "active").length;
    const canceled = initialSubs.filter((s) => s.status === "cancelled").length;
    const pastDue = initialSubs.filter((s) => s.status === "past_due").length;
    const mrr = initialSubs
      .filter((s) => s.status === "active" || s.status === "past_due")
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
    return { active, canceled, pastDue, mrr };
  }, [initialSubs]);

  // Filter subscriptions
  const filteredSubs = useMemo(() => {
    return initialSubs.filter((sub) => {
      const query = debouncedQuery.toLowerCase();
      if (query) {
        const email = (sub.user_email || "").toLowerCase();
        const id = sub.id.toLowerCase();
        const userId = sub.user_id.toLowerCase();
        if (
          !email.includes(query) &&
          !id.includes(query) &&
          !userId.includes(query)
        ) {
          return false;
        }
      }
      if (statusFilter && sub.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [initialSubs, searchQuery, statusFilter]);

  // Paginate
  const paginatedSubs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSubs.slice(start, start + PAGE_SIZE);
  }, [filteredSubs, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSubs.length / PAGE_SIZE));

  // Sync to URL
  // Skip initial mount sync to avoid redundant router.replace on first render
  const isInitialMount = useRef(true);

  const syncToUrl = useCallback(
    (q: string, status: string | null, page: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (page > 1) params.set("page", String(page));
      const newUrl = params.toString()
        ? `/admin/subscriptions?${params.toString()}`
        : "/admin/subscriptions";
      router.replace(newUrl, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Sync to URL whenever search params change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncToUrl(debouncedQuery, statusFilter, currentPage);
  }, [debouncedQuery, statusFilter, currentPage, syncToUrl]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          label="Canceled"
          value={stats.canceled}
          icon={XCircle}
          color="red"
        />
        <StatCard
          label="Past Due"
          value={stats.pastDue}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          label="MRR"
          value={`$${stats.mrr.toLocaleString()}`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Search/Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or subscription ID..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="h-10 pl-3 pr-8 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 text-sm appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Canceled</option>
            <option value="past_due">Past Due</option>
            <option value="trialing">Trialing</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />
        </div>
        {filteredSubs.length < initialSubs.length && (
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter(null);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-white/40 hover:text-white hover:border-white/20 transition-colors"
          >
            Clear ({initialSubs.length - filteredSubs.length} filtered)
          </button>
        )}
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  Next Billing
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedSubs.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${sub.user_id}`}
                      className="text-sm text-white hover:text-amber-400 transition-colors"
                    >
                      {sub.user_email || sub.user_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-white/60 uppercase">
                      {sub.plan || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={sub.status || "unknown"} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-white">
                      ${Number(sub.amount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/40 font-mono">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedSubs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-white/30"
                  >
                    No subscriptions match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/5">
          {paginatedSubs.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">
                No subscriptions match your search
              </p>
            </div>
          ) : (
            paginatedSubs.map((sub) => (
              <div key={sub.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {sub.user_email || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-white/40 uppercase">
                        {sub.plan || "—"}
                      </span>
                      <StatusPill status={sub.status || "unknown"} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-mono text-white">
                      ${Number(sub.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-white/40">per month</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    <span>PayPal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {sub.current_period_end
                        ? new Date(
                            sub.current_period_end,
                          ).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded p-1.5 text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 1,
              )
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-2">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-xs text-white/20">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[28px] rounded px-2 py-1 text-xs font-mono transition-colors ${
                      p === currentPage
                        ? "bg-amber-500/20 text-amber-400"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded p-1.5 text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper that provides Suspense boundary for useSearchParams.
 * Use this in server component pages.
 */
export function SubscriptionsSearch({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white/[0.02]" />}>
      <SubscriptionsSearchContent subscriptions={subscriptions} />
    </Suspense>
  );
}

// Helper components

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: typeof CreditCard;
  color: "emerald" | "red" | "yellow" | "amber";
}) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-6 w-6 rounded flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-500/15",
    cancelled: "text-red-400 bg-red-500/15",
    past_due: "text-yellow-400 bg-yellow-500/15",
    trialing: "text-cyan-400 bg-cyan-500/15",
  };

  return (
    <span
      className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${config[status] || "text-white/50 bg-white/5"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
