import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  Users, 
  CreditCard, 
  FolderKanban, 
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

/**
 * Admin Dashboard - Overview Stats
 */
export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) return null;

  // Fetch stats from Cosmos DB (Prism data)
  const usersCollection = await getCollection("users");
  const subscriptionsCollection = await getCollection("subscriptions");
  const projectsCollection = await getCollection("projects");

  const [
    totalUsers,
    proUsers,
    teamUsers,
    activeSubscriptions,
    totalProjects,
    recentUsers
  ] = await Promise.all([
    usersCollection.countDocuments({}),
    usersCollection.countDocuments({ tier: "pro" }),
    usersCollection.countDocuments({ tier: "team" }),
    subscriptionsCollection.countDocuments({ status: "active" }),
    projectsCollection.countDocuments({}),
    usersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray(),
  ]);

  const stats = [
    { 
      label: "Total Users", 
      value: totalUsers, 
      icon: Users, 
      trend: { value: 12, direction: "up" as const },
      href: "/admin/users"
    },
    { 
      label: "Pro Subscribers", 
      value: proUsers, 
      icon: CreditCard, 
      trend: { value: 8, direction: "up" as const },
      href: "/admin/subscriptions"
    },
    { 
      label: "Team Plans", 
      value: teamUsers, 
      icon: Users, 
      trend: { value: 0, direction: "neutral" as const },
      href: "/admin/subscriptions"
    },
    { 
      label: "Active Subscriptions", 
      value: activeSubscriptions, 
      icon: CreditCard, 
      trend: { value: 5, direction: "up" as const },
      href: "/admin/subscriptions"
    },
    { 
      label: "Total Projects", 
      value: totalProjects, 
      icon: FolderKanban, 
      trend: { value: 15, direction: "up" as const },
      href: "/admin/projects"
    },
    { 
      label: "Pending Inquiries", 
      value: 0, 
      icon: Mail, 
      trend: { value: 0, direction: "neutral" as const },
      href: "/admin/inquiries"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/50">Mission Control Overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 text-white/20 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white font-mono">{stat.value}</span>
              <TrendIndicator trend={stat.trend} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickAction
          href="/admin/users"
          title="Manage Users"
          description="View, suspend, or override user tiers"
          icon={Users}
        />
        <QuickAction
          href="/admin/inquiries"
          title="Client Inquiries"
          description="View and respond to client messages"
          icon={Mail}
        />
      </div>

      {/* Recent Users */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-sm font-medium text-white">Recent Users</h2>
          <Link 
            href="/admin/users" 
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {recentUsers.length > 0 ? (
            recentUsers.map((user) => (
              <div key={user._id.toString()} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                    {(user.email as string)?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-white">{user.email as string}</p>
                    <p className="text-[10px] text-white/40 font-mono">
                      {new Date(user.createdAt as string).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${
                  user.tier === "pro" ? "bg-amber-500/20 text-amber-400" :
                  user.tier === "team" ? "bg-purple-500/20 text-purple-400" :
                  "bg-white/10 text-white/50"
                }`}>
                  {user.tier as string || "free"}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-white/40 text-sm">
              No users yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: { value: number; direction: "up" | "down" | "neutral" } }) {
  const Icon = trend.direction === "up" ? TrendingUp : 
               trend.direction === "down" ? TrendingDown : Minus;
  const color = trend.direction === "up" ? "text-emerald-400" :
                trend.direction === "down" ? "text-red-400" : "text-white/30";
  
  return (
    <div className={`flex items-center gap-1 text-xs font-mono ${color}`}>
      <Icon className="h-3 w-3" />
      <span>{trend.value}%</span>
    </div>
  );
}

function QuickAction({ 
  href, 
  title, 
  description, 
  icon: Icon 
}: { 
  href: string; 
  title: string; 
  description: string; 
  icon: typeof Users;
}) {
  return (
    <Link
      href={href}
      className="group p-4 rounded-lg border border-white/5 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:border-amber-500/30 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
            <Icon className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <p className="text-xs text-white/50 mt-1">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-amber-400 transition-colors" />
      </div>
    </Link>
  );
}
