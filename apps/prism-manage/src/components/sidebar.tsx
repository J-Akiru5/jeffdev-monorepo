"use client";

/**
 * Sidebar Navigation
 * ------------------
 * Desktop sidebar showing workspace-aware navigation with RBAC.
 * - Personal Workspace: Shows personal lists (My Tasks, Academics, etc.)
 * - Syntaxure Labs Workspace: Shows 5 departments (founder) or 1 (employee)
 * Mobile: Hidden (uses bottom sheet drawer instead).
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Star,
  Calendar,
  LayoutGrid,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  TrendingUp,
  Building2,
  User,
  BookOpen,
  Users,
  GraduationCap,
  Bot,
} from "lucide-react";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { SupabaseUserButton } from "@/components/auth/supabase-user-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { PERSONAL_LISTS } from "@/lib/schemas";
import type { Department } from "@/lib/schemas";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickFilters: NavItem[] = [
  { label: "All Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Starred", href: "/tasks?filter=starred", icon: Star },
];

const views: NavItem[] = [
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Kanban", href: "/kanban", icon: LayoutGrid },
];

const marketingItem: NavItem = { label: "Marketing", href: "/marketing", icon: TrendingUp };

/** Map personal list name to its Lucide icon component */
function getPersonalListIcon(name: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "My Tasks": FolderKanban,
    Academics: BookOpen,
    "Student Council": Users,
    USC: GraduationCap,
    "SineAI Guild": Bot,
  };
  return iconMap[name] || FolderKanban;
}

/** Map department name to a color */
function getDepartmentColor(name: string): string {
  const colorMap: Record<string, string> = {
    Executive: "#8b5cf6",    // Purple
    Engineering: "#06b6d4",  // Cyan
    Operations: "#f59e0b",   // Amber
    Marketing: "#10b981",    // Emerald
    Product: "#3b82f6",      // Blue
  };
  return colorMap[name] || "var(--color-cyan)";
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { projects, setActiveProjectId } = useProjects();

  // Workspace state
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const departments = useWorkspaceStore((s) => s.departments);
  const userRole = useWorkspaceStore((s) => s.userRole);
  const userDepartmentId = useWorkspaceStore((s) => s.userDepartmentId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isSyntaxureLabs = activeWorkspace?.name === "Syntaxure Labs" || activeWorkspace?.name === "Syntaxure Labs, Inc.";
  const isPersonal = activeWorkspace?.name === "Personal";
  const isFounder = userRole === "founder";

  // Determine which departments to show based on RBAC
  const visibleDepartments: Department[] = isFounder
    ? departments
    : departments.slice(0, 1); // Employee sees only their assigned department (first one)

  // Determine if Marketing link should be shown
  const marketingDept = departments.find((d) => d.name === "Marketing");
  const isMarketingMember = !!marketingDept && (isFounder || userDepartmentId === marketingDept.id);

  const isActive = (href: string) => {
    if (href.includes("?")) {
      return pathname + (typeof window !== "undefined" ? window.location.search : "") === href;
    }
    return pathname === href;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/6 bg-surface transition-all duration-300 lg:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-cyan-400" />
            <span className="font-semibold text-white">Tracker</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-glass-05 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Workspace Switcher */}
        <div className="mb-4">
          <WorkspaceSwitcher collapsed={collapsed} />
        </div>

        {/* Quick Filters */}
        <div className="mb-6">
          {!collapsed && (
            <h3 className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-white/30">
              Quick Access
            </h3>
          )}
          <ul className="space-y-1">
            {quickFilters.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                      active
                        ? "bg-glass-10 text-white"
                        : "text-white/50 hover:bg-glass-05 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Views */}
        <div className="mb-6">
          {!collapsed && (
            <h3 className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-white/30">
              Views
            </h3>
          )}
          <ul className="space-y-1">
            {views.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                      active
                        ? "bg-glass-10 text-white"
                        : "text-white/50 hover:bg-glass-05 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}

            {/* Marketing link — only for founders or Marketing dept members */}
            {isMarketingMember && (
              <li key={marketingItem.href}>
                <Link
                  href={marketingItem.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                    isActive(marketingItem.href)
                      ? "bg-glass-10 text-white"
                      : "text-white/50 hover:bg-glass-05 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? marketingItem.label : undefined}
                >
                  <marketingItem.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{marketingItem.label}</span>}
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Workspace Sections */}
        {/* ── Personal Lists ── */}
        {(isPersonal || !activeWorkspace) && (
          <div className="mb-6">
            {!collapsed && (
              <div className="mb-2 flex items-center justify-between px-3">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                  Lists
                </h3>
                <button className="rounded p-1 text-white/30 hover:bg-glass-05 hover:text-white">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
            <ul className="space-y-1">
              {projects.length > 0
                ? projects.map((project) => {
                    const active = pathname.includes(`/projects/${project.id}`);
                    return (
                      <li key={project.id}>
                        <button
                          onClick={() => setActiveProjectId(project.id)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                            active
                              ? "bg-glass-10 text-white"
                              : "text-white/50 hover:bg-glass-05 hover:text-white"
                          } ${collapsed ? "justify-center" : ""}`}
                          title={collapsed ? project.name : undefined}
                        >
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: project.color || "var(--color-cyan)" }}
                          />
                          {!collapsed && (
                            <span className="truncate">{project.name}</span>
                          )}
                        </button>
                      </li>
                    );
                  })
                : PERSONAL_LISTS.map((list) => {
                    const Icon = getPersonalListIcon(list.name);
                    return (
                      <li key={list.name}>
                        <button
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-glass-05 hover:text-white ${
                            collapsed ? "justify-center" : ""
                          }`}
                          title={collapsed ? list.name : undefined}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && <span className="truncate">{list.name}</span>}
                        </button>
                      </li>
                    );
                  })}
            </ul>
          </div>
        )}

        {/* ── Syntaxure Labs Departments ── */}
        {isSyntaxureLabs && visibleDepartments.length > 0 && (
          <div className="mb-6">
            {!collapsed && (
              <div className="mb-2 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                    Departments
                  </h3>
                </div>
                {isFounder && (
                  <button className="rounded p-1 text-white/30 hover:bg-glass-05 hover:text-white" title="Add department">
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            <ul className="space-y-1">
              {visibleDepartments.map((dept) => {
                const deptHref = `/tasks?department=${dept.id}`;
                const active = pathname.includes(`department=${dept.id}`);
                const color = getDepartmentColor(dept.name);

                return (
                  <li key={dept.id}>
                    <Link
                      href={deptHref}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                        active
                          ? "bg-glass-10 text-white"
                          : "text-white/50 hover:bg-glass-05 hover:text-white"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? dept.name : undefined}
                    >
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {!collapsed && <span className="truncate">{dept.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── Legacy Project Lists (fallback) ── */}
        {!isPersonal && !isSyntaxureLabs && projects.length > 0 && (
          <div className="mb-6">
            {!collapsed && (
              <div className="mb-2 flex items-center justify-between px-3">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                  Lists
                </h3>
                <button className="rounded p-1 text-white/30 hover:bg-glass-05 hover:text-white">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
            <ul className="space-y-1">
              {projects.map((project) => {
                const active = pathname.includes(`/projects/${project.id}`);
                return (
                  <li key={project.id}>
                    <button
                      onClick={() => setActiveProjectId(project.id)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                        active
                          ? "bg-glass-10 text-white"
                          : "text-white/50 hover:bg-glass-05 hover:text-white"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? project.name : undefined}
                    >
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: project.color || "var(--color-cyan)" }}
                      />
                      {!collapsed && (
                        <span className="truncate">{project.name}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.06] p-3 space-y-1">
        {!collapsed && <SupabaseUserButton />}
        {!collapsed && <ThemeToggle />}
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-glass-05 hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
