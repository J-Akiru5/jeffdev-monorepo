"use client";

import { useState, useEffect, useMemo, useCallback, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue, useActionFeedback } from "@syntaxure/ui";
import {
  Search,
  Filter,
  ShieldCheck,
  Crown,
  User,
  Mail,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { overrideUserTier, toggleUserStatus } from "@/app/actions/users";

interface UserDoc {
  _id: { toString: () => string };
  email?: string;
  name?: string;
  tier?: string;
  status?: string;
  createdAt?: string;
}

interface Props {
  users: UserDoc[];
  isFounder: boolean;
}

const TIERS = ["free", "pro", "team"] as const;

const PAGE_SIZE = 25;

export function UsersTable({ users, isFounder }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL search params
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || "",
  );
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [tierFilter, setTierFilter] = useState<string | null>(
    () => searchParams.get("tier") || null,
  );
  const [currentPage, setCurrentPage] = useState(
    () => Number(searchParams.get("page")) || 1,
  );
  const [, startTransition] = useTransition();

  // Track action state for toast feedback via useActionFeedback
  const [tierActionState, setTierActionState] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [statusActionState, setStatusActionState] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);

  useActionFeedback(tierActionState, {
    successMessage: "Tier updated",
    fallbackErrorMessage: "Failed to update tier",
  });
  useActionFeedback(statusActionState, {
    successMessage: "User status updated",
    fallbackErrorMessage: "Failed to update status",
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const email = (user.email || "").toLowerCase();
      const name = (user.name || "").toLowerCase();
      const query = debouncedQuery.toLowerCase();

      if (debouncedQuery && !email.includes(query) && !name.includes(query)) {
        return false;
      }

      if (tierFilter && (user.tier || "free") !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [users, debouncedQuery, tierFilter]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const tier = user.tier || "free";
      counts[tier] = (counts[tier] || 0) + 1;
    }
    return counts;
  }, [users]);

  async function handleOverrideTier(userId: string) {
    const tier = prompt("Enter new tier (free, pro, team):");
    if (!tier || !TIERS.includes(tier as typeof TIERS[number])) {
      setTierActionState({ success: false, error: "Invalid tier. Choose: free, pro, or team." });
      return;
    }
    startTransition(async () => {
      const result = await overrideUserTier(userId, tier);
      setTierActionState(result);
    });
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    startTransition(async () => {
      const result = await toggleUserStatus(userId, currentStatus);
      setStatusActionState(result);
    });
  }

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const startRange = (currentPage - 1) * PAGE_SIZE + 1;
  const endRange = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  // Skip initial mount sync to avoid redundant router.replace on first render
  const isInitialMount = useRef(true);

  const syncToUrl = useCallback(
    (q: string, tier: string | null, page: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (tier) params.set("tier", tier);
      if (page > 1) params.set("page", String(page));
      const newUrl = params.toString()
        ? `/admin/users?${params.toString()}`
        : "/admin/users";
      router.replace(newUrl, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tierFilter]);

  // Sync to URL whenever search params change (skip initial mount)
  // URL sync uses debouncedQuery so rapid typing doesn't spam router.replace
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncToUrl(debouncedQuery, tierFilter, currentPage);
  }, [debouncedQuery, tierFilter, currentPage, syncToUrl]);

  return (
    <>
      {/* Tier Summary */}
      <div className="flex gap-2 flex-wrap">
        <TierCountBadge
          tier="free"
          count={tierCounts.free || 0}
          active={tierFilter === "free"}
          onClick={() => setTierFilter(tierFilter === "free" ? null : "free")}
        />
        <TierCountBadge
          tier="pro"
          count={tierCounts.pro || 0}
          active={tierFilter === "pro"}
          onClick={() => setTierFilter(tierFilter === "pro" ? null : "pro")}
        />
        <TierCountBadge
          tier="team"
          count={tierCounts.team || 0}
          active={tierFilter === "team"}
          onClick={() => setTierFilter(tierFilter === "team" ? null : "team")}
        />
        {tierFilter && (
          <button
            onClick={() => setTierFilter(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/40 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Search/Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by email or name..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="relative">
          <select
            value={tierFilter || ""}
            onChange={(e) => setTierFilter(e.target.value || null)}
            className="h-10 px-4 pr-8 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 text-sm appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50"
          >
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="team">Team</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
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
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-white/30">
                    No users match your search
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user._id.toString()}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                          {(user.email || "?")?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-white">
                            {user.name || "—"}
                          </p>
                          <p className="text-xs text-white/40">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TierPill tier={user.tier || "free"} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={user.status || "active"} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/40 font-mono">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isFounder && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOverrideTier(user._id.toString())}
                            className="rounded px-2 py-1 text-[10px] font-medium text-white/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Override tier"
                          >
                            Override
                          </button>
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                user._id.toString(),
                                user.status || "active",
                              )
                            }
                            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                              user.status === "suspended"
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-white/50 hover:text-red-400 hover:bg-red-500/10"
                            }`}
                            title={
                              user.status === "suspended"
                                ? "Reactivate user"
                                : "Suspend user"
                            }
                          >
                            {user.status === "suspended" ? "Reactivate" : "Suspend"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/5">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-sm text-white/30">
              No users match your search
            </div>
          ) : (
            paginatedUsers.map((user) => (
              <div key={user._id.toString()} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                      {(user.email || "?")?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user.name || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <TierPill tier={user.tier || "free"} />
                        <StatusPill status={user.status || "active"} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-white/40">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
                {isFounder && (
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleOverrideTier(user._id.toString())}
                      className="flex-1 py-1.5 text-xs text-white/60 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                    >
                      Override Tier
                    </button>
                    <button
                      onClick={() =>
                        handleToggleStatus(
                          user._id.toString(),
                          user.status || "active",
                        )
                      }
                      className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                        user.status === "suspended"
                          ? "text-emerald-400 hover:bg-emerald-500/10"
                          : "text-white/60 hover:text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      {user.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs text-white/30 font-mono">
            {startRange}–{endRange} of {filteredUsers.length}
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
          <div className="w-20" />
        </div>
      )}
    </>
  );
}

function TierCountBadge({
  tier,
  count,
  active,
  onClick,
}: {
  tier: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const config = {
    free: { icon: User, color: "text-white/50 bg-white/5 border-white/10" },
    pro: {
      icon: ShieldCheck,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    team: {
      icon: Crown,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  };
  const { icon: Icon, color } = config[tier as keyof typeof config] || config.free;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
        active ? "ring-1 ring-amber-500/50 " : ""
      }${color}`}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium capitalize">{tier}</span>
      <span className="text-xs font-mono opacity-60">{count}</span>
    </button>
  );
}

function TierPill({ tier }: { tier: string }) {
  const config: Record<string, string> = {
    free: "text-white/50 bg-white/5",
    pro: "text-amber-400 bg-amber-500/15",
    team: "text-purple-400 bg-purple-500/15",
  };
  return (
    <span
      className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${config[tier] || config.free}`}
    >
      {tier}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-500/15",
    suspended: "text-red-400 bg-red-500/15",
    pending: "text-yellow-400 bg-yellow-500/15",
  };
  return (
    <span
      className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${config[status] || "text-white/50 bg-white/5"}`}
    >
      {status}
    </span>
  );
}
