"use client";

/**
 * Mobile Bottom Navigation
 * ------------------------
 * Fixed bottom tab bar for mobile devices.
 * Shows primary views + "Lists" drawer with workspace-aware content.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  CheckSquare,
  Calendar,
  LayoutGrid,
  FolderOpen,
  X,
  Plus,
  Star,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createClient } from "@/lib/supabase/browser";
import { PERSONAL_LISTS } from "@/lib/schemas";

function SignOutButton() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-text-tertiary transition-colors hover:bg-glass-05 hover:text-red-400"
    >
      <LogOut className="h-5 w-5" />
      <span>Sign Out</span>
    </button>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { projects, setActiveProjectId, activeProjectId } = useProjects();

  // Workspace state
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const departments = useWorkspaceStore((s) => s.departments);
  const userRole = useWorkspaceStore((s) => s.userRole);
  const userDepartmentId = useWorkspaceStore((s) => s.userDepartmentId);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isSyntaxureLabs = activeWorkspace?.name === "Syntaxure Labs" || activeWorkspace?.name === "Syntaxure Labs, Inc.";
  const isPersonal = activeWorkspace?.name === "Personal";
  const isFounder = userRole === "founder";

  // C-Level scoping
  const cLevelDepartment = cLevelTitle
    ? ({ ceo: null, cto: "Engineering", cpo: "Product", coo: "Operations", cmo: "Marketing" } as const)[cLevelTitle]
    : null;

  const tabs = [
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Kanban", href: "/kanban", icon: LayoutGrid },
  ];

  const marketingTab = { label: "Mktg", href: "/marketing", icon: CheckSquare };

  // Determine if Marketing tab should be shown
  const marketingDept = departments.find((d) => d.name === "Marketing");
  const isMarketingMember = !!marketingDept && (
    cLevelTitle === "ceo" ||
    cLevelTitle === "cmo" ||
    (!cLevelTitle && isFounder) ||
    userDepartmentId === marketingDept.id
  );

  const handleProjectClick = (projectId: string) => {
    setActiveProjectId(projectId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-surface/80 px-2 backdrop-blur-xl lg:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setIsDrawerOpen(false)}
              className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all ${
                isActive ? "text-cyan-400" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}

        {/* Marketing Tab — only for founders or Marketing dept members */}
        {isMarketingMember && (
          <Link
            key={marketingTab.href}
            href={marketingTab.href}
            onClick={() => setIsDrawerOpen(false)}
            className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all ${
              pathname === marketingTab.href ? "text-cyan-400" : "text-text-muted hover:text-text-primary"
            }`}
          >
            <marketingTab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{marketingTab.label}</span>
          </Link>
        )}

        {/* Lists Button */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all ${
            isDrawerOpen ? "text-cyan-400" : "text-text-muted hover:text-text-primary"
          }`}
        >
          {isDrawerOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <FolderOpen className="h-5 w-5" />
          )}
          <span className="text-[10px] font-medium">Lists</span>
        </button>
      </div>

      {/* Slide-up Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-16 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-border bg-elevated p-6 shadow-2xl lg:hidden"
            >
              {/* Drag Handle */}
              <div className="mb-6 flex items-center justify-center">
                <div className="h-1 w-12 rounded-full bg-glass-20" />
              </div>

              {/* Quick Filters */}
              <div className="mb-6">
                <h3 className="mb-3 px-2 font-mono text-xs uppercase tracking-wider text-text-quiet">
                  Quick Access
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/tasks"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-glass-05 glass-subtle p-3 text-text-tertiary transition-all active:scale-95 hover:bg-glass-05 hover:text-text-primary"
                  >
                    <CheckSquare className="h-5 w-5 text-cyan-500/80" />
                    <span className="text-sm font-medium">All Tasks</span>
                  </Link>
                  <Link
                    href="/tasks?filter=starred"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-glass-05 glass-subtle p-3 text-text-tertiary transition-all active:scale-95 hover:bg-glass-05 hover:text-text-primary"
                  >
                    <Star className="h-5 w-5 text-yellow-500/80" />
                    <span className="text-sm font-medium">Starred</span>
                  </Link>
                </div>
              </div>

              {/* Workspace Sections */}
              {/* ── Personal Lists ── */}
              {(isPersonal || !activeWorkspace) && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-text-quiet">
                      {isPersonal ? "Your Lists" : "Lists"}
                    </h3>
                    <button className="rounded-lg p-2 text-cyan-400 hover:bg-cyan-400/10">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {projects.length === 0 ? (
                      PERSONAL_LISTS.map((list) => (
                        <button
                          key={list.name}
                          disabled
                          className="flex w-full items-center gap-3 rounded-xl border border-glass-05 glass-subtle p-3 text-text-muted"
                        >
                          <span className="text-sm font-medium">{list.name}</span>
                        </button>
                      ))
                    ) : (
                      projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectClick(project.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all active:scale-95 ${
                            activeProjectId === project.id
                              ? "border-glass-10 bg-glass-10 text-text-primary"
                              : "border-glass-05 glass-subtle text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: project.color || "var(--color-cyan)",
                            }}
                          />
                          <span className="text-sm font-medium">
                            {project.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Syntaxure Labs Departments ── */}
              {isSyntaxureLabs && departments.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-text-quiet">
                      Departments
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {(isFounder
                ? cLevelDepartment
                  ? departments.filter((d) => d.name === cLevelDepartment)
                  : departments
                : departments.filter((d) => d.id === userDepartmentId)
              ).map((dept) => (
                      <Link
                        key={dept.id}
                        href={`/tasks?department=${dept.id}`}
                        onClick={() => setIsDrawerOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl border border-glass-05 glass-subtle p-3 text-text-tertiary transition-all active:scale-95 hover:bg-glass-05 hover:text-text-primary"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: getDepartmentColor(dept.name),
                          }}
                        />
                        <span className="text-sm font-medium">{dept.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy: Show projects if no workspace match */}
              {!isPersonal && !isSyntaxureLabs && projects.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-text-quiet">
                      Your Lists
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all active:scale-95 ${
                          activeProjectId === project.id
                            ? "border-glass-10 bg-glass-10 text-text-primary"
                            : "border-glass-05 glass-subtle text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: project.color || "var(--color-cyan)",
                          }}
                        />
                        <span className="text-sm font-medium">
                          {project.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings & Sign Out */}
              <div className="border-t border-glass-10 pt-4 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-text-tertiary transition-colors hover:bg-glass-05 hover:text-text-primary"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                <SignOutButton />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function getDepartmentColor(name: string): string {
  const colorMap: Record<string, string> = {
    Executive: "#8b5cf6",
    Engineering: "#06b6d4",
    Operations: "#f59e0b",
    Marketing: "#10b981",
    Product: "#3b82f6",
  };
  return colorMap[name] || "var(--color-cyan)";
}
