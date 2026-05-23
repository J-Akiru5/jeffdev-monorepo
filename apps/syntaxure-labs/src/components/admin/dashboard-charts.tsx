'use client';

/**
 * Dashboard Charts Section
 * -------------------------
 * Client component wrapper for Recharts.
 */

import { ActivityChart, ProjectStatusChart, RevenueChart } from './charts';

interface DashboardChartsProps {
  activityData: { date: string; quotes: number; messages: number }[];
  projectData: { name: string; value: number; color: string }[];
  revenueData: { month: string; revenue: number }[];
}

export function DashboardCharts({
  activityData,
  projectData,
  revenueData,
}: DashboardChartsProps) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Activity Chart */}
      <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 font-semibold text-white">Activity (30 Days)</h2>
        <ActivityChart data={activityData} />
      </div>

      {/* Project Status + Revenue */}
      <div className="space-y-6">
        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="mb-4 font-semibold text-white">Project Status</h2>
          <ProjectStatusChart data={projectData} />
        </div>

        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="mb-4 font-semibold text-white">Revenue</h2>
          <RevenueChart data={revenueData} />
        </div>
      </div>
    </div>
  );
}
