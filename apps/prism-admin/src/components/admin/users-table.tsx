"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  Crown,
  User,
  Mail,
  Calendar,
  X,
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

export function UsersTable({ users, isFounder }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const email = (user.email || "").toLowerCase();
      const name = (user.name || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      if (searchQuery && !email.includes(query) && !name.includes(query)) {
        return false;
      }

      if (tierFilter && (user.tier || "free") !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, tierFilter]);

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
      setActionMessage({ type: "error", text: "Invalid tier. Choose: free, pro, or team." });
      return;
    }
    const result = await overrideUserTier(userId, tier);
    setActionMessage({
      type: result.success ? "success" : "error",
      text: result.success
        ? `Tier updated to "${tier}"`
        : result.error || "Failed to update tier",
    });
    setTimeout(() => setActionMessage(null), 3000);
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const result = await toggleUserStatus(userId, currentStatus);
    setActionMessage({
      type: result.success ? "success" : "error",
      text: result.success
        ? `User ${currentStatus === "suspended" ? "reactivated" : "suspended"}`
        : result.error || "Failed to update status",
    });
    setTimeout(() => setActionMessage(null), 3000);
  }

  return (
    <>
      {/* Action Message */}
      {actionMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

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
                filteredUsers.map((user) => (
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
            filteredUsers.map((user) => (
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
