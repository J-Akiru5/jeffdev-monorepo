"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Dashboard Charts Component
 * ---------------------------
 * Activity, revenue, and project status charts for the agency dashboard.
 */

interface ChartData {
  monthlyRevenue: { month: string; amount: number }[];
  projectStatuses: { status: string; count: number }[];
  recentActivity: { date: string; action: string; resource: string }[];
}

export function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/agency/dashboard/charts");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load chart data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8 text-center text-sm text-white/30">
        Unable to load dashboard data
      </div>
    );
  }

  const maxRevenue = Math.max(...data.monthlyRevenue.map((r) => r.amount), 1);
  const maxStatusCount = Math.max(...data.projectStatuses.map((s) => s.count), 1);

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/60",
    pending: "bg-yellow-500/60",
    paused: "bg-amber-500/60",
    completed: "bg-blue-500/60",
    archived: "bg-white/20",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue Chart */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <h3 className="text-sm font-medium text-white/80 mb-4">Monthly Revenue</h3>
        <div className="flex items-end gap-2 h-32">
          {data.monthlyRevenue.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm bg-cyan-500/50 hover:bg-cyan-500/70 transition-all"
                style={{ height: `${(item.amount / maxRevenue) * 100}%`, minHeight: item.amount > 0 ? "4px" : "1px" }}
              />
              <span className="text-[9px] text-white/30 truncate w-full text-center">
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Status Chart */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <h3 className="text-sm font-medium text-white/80 mb-4">Project Status</h3>
        <div className="space-y-3">
          {data.projectStatuses.map((item) => (
            <div key={item.status} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 capitalize">{item.status}</span>
                <span className="text-white/40">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    statusColors[item.status] || "bg-white/20"
                  }`}
                  style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="lg:col-span-2 rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <h3 className="text-sm font-medium text-white/80 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {data.recentActivity.slice(0, 10).map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-white/30 w-20 shrink-0">
                {new Date(item.date).toLocaleDateString()}
              </span>
              <span className="rounded-sm bg-white/5 px-1.5 py-0.5 text-white/50 font-mono uppercase text-[9px]">
                {item.action}
              </span>
              <span className="text-white/60">{item.resource}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
