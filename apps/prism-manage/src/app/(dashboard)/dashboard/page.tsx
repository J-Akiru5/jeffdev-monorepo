/**
 * Syntaxure Labs HQ — Dashboard Landing Page
 * --------------------------------------------
 * The headquarters overview for Syntaxure Labs workspace.
 * Shows department stats, workspace members, and quick links.
 */

import { createClient } from "@/lib/supabase/server";
import {
  BriefcaseBusiness,
  Building2,
  Users,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { SyntaxureLogo, EmptyState } from "@syntaxure/ui";
import { resolveSyntaxureWorkspace } from "@/lib/workspace";
import { getPortfolioData } from "@/app/actions/portfolio";
import {
  DEPARTMENT_COLORS,
  DEPARTMENT_DESCRIPTIONS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HQLandingPage() {
  const wsData = await resolveSyntaxureWorkspace();

  if (!wsData) {
    return (
      <EmptyState
        icon={<Building2 className="h-7 w-7 text-white/20" />}
        title="No Workspace Found"
        description="Syntaxure Labs workspace has not been set up yet. Contact an admin."
      />
    );
  }

  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("role, department_id")
    .eq("workspace_id", wsData.workspaceId);

  if (membersError) {
    console.error("[Dashboard] Failed to fetch members:", membersError.message);
  }

  const totalMembers = members?.length || 0;
  const deptMemberCounts: Record<string, number> = {};
  (members || []).forEach((m: Record<string, unknown>) => {
    const deptId = m.department_id as string | null;
    if (deptId) {
      deptMemberCounts[deptId] = (deptMemberCounts[deptId] || 0) + 1;
    }
  });

  const { count: taskCount, error: taskError } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", wsData.workspaceId);

  if (taskError) {
    console.error("[Dashboard] Failed to fetch task count:", taskError.message);
  }

  const { count: doneCount, error: doneError } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", wsData.workspaceId)
    .in("status", ["approved"]);

  if (doneError) {
    console.error("[Dashboard] Failed to fetch done count:", doneError.message);
  }

  const departments = wsData.departments;
  const isFounder = wsData.userRole === "founder";

  // Portfolio summary for the dashboard card (read-only; amounts are not shown).
  const portfolio = await getPortfolioData();

  const stats = [
    { label: "Departments", value: departments.length, icon: Layers, color: "text-cyan-400" },
    { label: "Members", value: totalMembers, icon: Users, color: "text-purple-400" },
    { label: "Tasks", value: taskCount || 0, icon: CheckSquare, color: "text-emerald-400" },
    { label: "Completed", value: doneCount || 0, icon: Sparkles, color: "text-amber-400" },
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      {/* Hero Section */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <SyntaxureLogo className="h-10 w-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              {wsData.workspaceName}
            </h1>
            <p className="text-sm text-white/40">
              Zero-to-One Development Agency
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div data-tour="dashboard-stats" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.10] hover:bg-white/[0.04]"
              >
                <div className={`flex items-center gap-2 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                    {stat.label}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portfolio */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-mono uppercase tracking-wider text-white/40">
          Portfolio
        </h2>
        <Link
          href="/portfolio"
          className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-semibold text-white">Portfolio overview</h3>
              <p className="mt-0.5 text-xs text-white/40">
                Every venture, client engagement and internal build
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <PortfolioCount label="Projects" value={portfolio.stats.total} />
            <PortfolioCount label="Ventures" value={portfolio.stats.ventures} />
            <PortfolioCount label="Clients" value={portfolio.stats.clients} />
            <PortfolioCount
              label="In maintenance"
              value={portfolio.stats.maintenance}
            />
            <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" />
          </div>
        </Link>
      </section>

      {/* Departments Grid */}
      <section data-tour="dashboard-departments">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-wider text-white/40">
            Departments
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const color = DEPARTMENT_COLORS[dept.name] || "#06b6d4";
            const description = DEPARTMENT_DESCRIPTIONS[dept.name] || "";
            const memberCount = deptMemberCounts[dept.id] || 0;

            return (
              <Link
                key={dept.id}
                href={`/tasks?department=${dept.id}`}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <h3 className="font-semibold text-white">
                      {dept.name}
                    </h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" />
                </div>
                {description && (
                  <p className="mt-2 text-xs text-white/40">{description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
                  <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Actions (Founders only) */}
      {isFounder && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-mono uppercase tracking-wider text-white/40">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-white"
            >
              Manage Members
            </Link>
            <Link
              href="/marketing"
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-white"
            >
              Marketing Dashboard
            </Link>
            <Link
              href="/tasks"
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-white"
            >
              View All Tasks
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

/** Small inline stat for the Portfolio card (keeps the dashboard server-only). */
function PortfolioCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-lg font-semibold text-white">{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </span>
    </div>
  );
}
