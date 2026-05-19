import { auth, currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Crown,
  User,
  Mail,
  Calendar
} from "lucide-react";

/**
 * User Management Page
 * List all users with search/filter and tier management
 */
export default async function UsersPage() {
  const { userId } = await auth();
  const clerk = await currentUser();
  const role = (clerk?.publicMetadata as { role?: string })?.role || "user";
  const isFounder = role === "founder";
  
  if (!userId) return null;

  const usersCollection = await getCollection("users");
  const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();

  // Group by tier for stats
  const tierCounts = users.reduce((acc, user) => {
    const tier = (user.tier as string) || "free";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-white/50">{users.length} total users</p>
        </div>
      </div>

      {/* Tier Summary */}
      <div className="flex gap-2 flex-wrap">
        <TierBadge tier="free" count={tierCounts.free || 0} />
        <TierBadge tier="pro" count={tierCounts.pro || 0} />
        <TierBadge tier="team" count={tierCounts.team || 0} />
      </div>

      {/* Search/Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search users by email..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 flex items-center gap-2 transition-colors">
          <Filter className="h-4 w-4" />
          <span className="text-sm hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user._id.toString()} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                        {(user.email as string)?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm text-white">{user.name as string || "—"}</p>
                        <p className="text-xs text-white/40">{user.email as string}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TierPill tier={(user.tier as string) || "free"} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={(user.status as string) || "active"} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/40 font-mono">
                      {user.createdAt ? new Date(user.createdAt as string).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button title="More options" aria-label="User options menu" className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/5">
          {users.map((user) => (
            <div key={user._id.toString()} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                    {(user.email as string)?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name as string || "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <TierPill tier={(user.tier as string) || "free"} />
                      <StatusPill status={(user.status as string) || "active"} />
                    </div>
                  </div>
                </div>
                <button title="More options" aria-label="User options menu" className="p-2 rounded-md hover:bg-white/10 text-white/40">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-white/40">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email as string}</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <Calendar className="h-3 w-3" />
                  <span>{user.createdAt ? new Date(user.createdAt as string).toLocaleDateString() : "—"}</span>
                </div>
              </div>
              {isFounder && (
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button className="flex-1 py-1.5 text-xs text-white/60 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors">
                    Override Tier
                  </button>
                  <button className="flex-1 py-1.5 text-xs text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                    Suspend
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <User className="h-8 w-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TierBadge({ tier, count }: { tier: string; count: number }) {
  const config = {
    free: { icon: User, color: "text-white/50 bg-white/5 border-white/10" },
    pro: { icon: ShieldCheck, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    team: { icon: Crown, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  }[tier] || { icon: User, color: "text-white/50 bg-white/5 border-white/10" };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}>
      <config.icon className="h-3 w-3" />
      <span className="text-xs font-medium capitalize">{tier}</span>
      <span className="text-xs font-mono opacity-60">{count}</span>
    </div>
  );
}

function TierPill({ tier }: { tier: string }) {
  const config = {
    free: "text-white/50 bg-white/5",
    pro: "text-amber-400 bg-amber-500/15",
    team: "text-purple-400 bg-purple-500/15",
  }[tier] || "text-white/50 bg-white/5";

  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${config}`}>
      {tier}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const config = {
    active: "text-emerald-400 bg-emerald-500/15",
    suspended: "text-red-400 bg-red-500/15",
    pending: "text-yellow-400 bg-yellow-500/15",
  }[status] || "text-white/50 bg-white/5";

  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${config}`}>
      {status}
    </span>
  );
}
