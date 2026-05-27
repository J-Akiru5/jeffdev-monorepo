/**
 * Syntaxure Labs HQ — Dashboard Landing Page
 * --------------------------------------------
 * The headquarters overview for Syntaxure Labs workspace.
 * Shows department stats, workspace members, and quick links.
 */

import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Users,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DEPARTMENT_COLORS: Record<string, string> = {
  Executive: "#8b5cf6",
  Engineering: "#06b6d4",
  Operations: "#f59e0b",
  Marketing: "#10b981",
  Product: "#3b82f6",
};

const DEPARTMENT_DESCRIPTIONS: Record<string, string> = {
  Executive: "Strategy, vision & leadership",
  Engineering: "Building Prism and core infrastructure",
  Operations: "Agency ops, CRM & client delivery",
  Marketing: "GTM, content & brand strategy",
  Product: "Product design, UX & roadmap",
};

export default async function HQLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch Syntaxure Labs workspace
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name, created_at")
    .or("name.eq.Syntaxure Labs,name.eq.Syntaxure Labs, Inc.")
    .limit(1)
    .single();

  const syntaxureWs = workspaces as { id: string; name: string; created_at: string } | null;

  if (!syntaxureWs) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-text-muted" />
        <h1 className="mt-4 text-xl font-semibold text-text-primary">No Workspace Found</h1>
        <p className="mt-2 text-sm text-text-muted">
          Syntaxure Labs workspace has not been set up yet. Contact an admin.
        </p>
      </div>
    );
  }

  // Fetch departments
  const { data: depts } = await supabase
    .from("departments")
    .select("*")
    .eq("workspace_id", syntaxureWs.id)
    .order("name", { ascending: true });

  const departments = (depts || []).map((d: Record<string, unknown>) => ({
    id: String(d.id),
    name: String(d.name),
  }));

  // Fetch member counts per department
  const { data: members } = await supabase
    .from("workspace_members")
    .select("role, department_id")
    .eq("workspace_id", syntaxureWs.id);

  const totalMembers = members?.length || 0;
  const deptMemberCounts: Record<string, number> = {};
  (members || []).forEach((m: Record<string, unknown>) => {
    const deptId = m.department_id as string | null;
    if (deptId) {
      deptMemberCounts[deptId] = (deptMemberCounts[deptId] || 0) + 1;
    }
  });

  // Fetch task stats
  const { count: taskCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", syntaxureWs.id);

  const { count: doneCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", syntaxureWs.id)
    .in("status", ["approved"]);

  // Get current user's role
  const { data: myMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", syntaxureWs.id)
    .eq("user_id", user.id)
    .single();

  const isFounder = myMembership?.role === "founder";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-3 ring-1 ring-white/10">
            <Building2 className="h-7 w-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Syntaxure Labs
            </h1>
            <p className="text-sm text-text-muted">
              Zero-to-One Development Agency
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-glass-10 bg-elevated/50 p-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Layers className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider text-text-quiet">
                Departments
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {departments.length}
            </p>
          </div>
          <div className="rounded-xl border border-glass-10 bg-elevated/50 p-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Users className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider text-text-quiet">
                Members
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {totalMembers}
            </p>
          </div>
          <div className="rounded-xl border border-glass-10 bg-elevated/50 p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckSquare className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider text-text-quiet">
                Tasks
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {taskCount || 0}
            </p>
          </div>
          <div className="rounded-xl border border-glass-10 bg-elevated/50 p-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider text-text-quiet">
                Completed
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {doneCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-quiet">
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
                className="group rounded-xl border border-glass-10 bg-elevated/30 p-5 transition-all hover:border-[var(--dept-color)]/30 hover:bg-elevated/60 hover:shadow-lg"
                style={{ "--dept-color": color } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <h3 className="font-semibold text-text-primary">
                      {dept.name}
                    </h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
                </div>
                {description && (
                  <p className="mt-2 text-xs text-text-muted">{description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
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
          <h2 className="mb-4 text-sm font-mono uppercase tracking-wider text-text-quiet">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="rounded-lg border border-glass-10 bg-elevated/30 px-4 py-2 text-sm text-text-secondary transition-all hover:border-cyan-500/30 hover:text-text-primary"
            >
              Manage Members
            </Link>
            <Link
              href="/marketing"
              className="rounded-lg border border-glass-10 bg-elevated/30 px-4 py-2 text-sm text-text-secondary transition-all hover:border-cyan-500/30 hover:text-text-primary"
            >
              Marketing Dashboard
            </Link>
            <Link
              href="/tasks"
              className="rounded-lg border border-glass-10 bg-elevated/30 px-4 py-2 text-sm text-text-secondary transition-all hover:border-cyan-500/30 hover:text-text-primary"
            >
              View All Tasks
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
