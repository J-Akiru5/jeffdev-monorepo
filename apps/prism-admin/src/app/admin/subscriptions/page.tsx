import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  Search, 
  Filter,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from "lucide-react";
import Link from "next/link";

/**
 * Subscription Management Page
 */
export default async function SubscriptionsPage() {
  const { userId } = await auth();
  
  if (!userId) return null;

  const subscriptionsCollection = await getCollection("subscriptions");
  const subscriptions = await subscriptionsCollection.find({}).sort({ createdAt: -1 }).toArray();

  // Calculate stats
  const stats = {
    active: subscriptions.filter(s => s.status === "active").length,
    canceled: subscriptions.filter(s => s.status === "canceled").length,
    pastDue: subscriptions.filter(s => s.status === "past_due").length,
    mrr: subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => sum + ((s.amount as number) || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-sm text-white/50">{subscriptions.length} total subscriptions</p>
        </div>
      </div>

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
            placeholder="Search by user or subscription ID..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 flex items-center gap-2 transition-colors">
          <Filter className="h-4 w-4" />
          <span className="text-sm hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">Next Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subscriptions.map((sub) => (
                <tr key={sub._id.toString()} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${sub.userId}`} className="text-sm text-white hover:text-amber-400 transition-colors">
                      {sub.userEmail as string || sub.userId as string}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-white/60 uppercase">{sub.plan as string || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={(sub.status as string) || "unknown"} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-white">${(sub.amount as number)?.toFixed(2) || "0.00"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/40 font-mono">
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate as string).toLocaleDateString() : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/5">
          {subscriptions.map((sub) => (
            <div key={sub._id.toString()} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{sub.userEmail as string || "Unknown"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-white/40 uppercase">{sub.plan as string || "—"}</span>
                    <StatusPill status={(sub.status as string) || "unknown"} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono text-white">${(sub.amount as number)?.toFixed(2) || "0.00"}</p>
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
                  <span>{sub.nextBillingDate ? new Date(sub.nextBillingDate as string).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {subscriptions.length === 0 && (
          <div className="p-12 text-center">
            <CreditCard className="h-8 w-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">No subscriptions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
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
        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config = {
    active: "text-emerald-400 bg-emerald-500/15",
    canceled: "text-red-400 bg-red-500/15",
    past_due: "text-yellow-400 bg-yellow-500/15",
    trialing: "text-cyan-400 bg-cyan-500/15",
  }[status] || "text-white/50 bg-white/5";

  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${config}`}>
      {status.replace("_", " ")}
    </span>
  );
}
