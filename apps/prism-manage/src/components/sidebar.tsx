"use client";

/**
 * Sidebar Navigation
 * ------------------
 * Desktop sidebar showing project lists and quick filters.
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
} from "lucide-react";
import { useProjects } from "@/contexts/project-context";

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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { projects, setActiveProjectId } = useProjects();

  const isActive = (href: string) => {
    if (href.includes("?")) {
      return (
        pathname +
          (typeof window !== "undefined" ? window.location.search : "") ===
        href
      );
    }
    return pathname === href;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/6 bg-void transition-all duration-300 lg:flex ${
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
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
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
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
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
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
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

        {/* Project Lists */}
        <div className="mb-6">
          {!collapsed && (
            <div className="mb-2 flex items-center justify-between px-3">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                Lists
              </h3>
              <button className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white">
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
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? project.name : undefined}
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: project.color || "#06b6d4" }}
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
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.06] p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white ${
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
