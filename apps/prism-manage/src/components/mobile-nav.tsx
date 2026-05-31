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
  Keyboard,
} from "lucide-react";
import { KeyboardShortcutsHelp } from "@syntaxure/ui";
import { MANAGE_HELP_SHORTCUTS } from "@/lib/keyboard-shortcuts";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createClient } from "@/lib/supabase/browser";
import { PERSONAL_LISTS } from "@/lib/schemas";
import { getDepartmentColor } from "@/lib/constants";

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
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-red-400"
    >
      <LogOut className="h-5 w-5" />
      <span>Sign Out</span>
    </button>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { projects, setActiveProjectId, activeProjectId } = useProjects();

  // Workspace state
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const departments = useWorkspaceStore((s) => s.departments);
  const userRole = useWorkspaceStore((s) => s.userRole);
  const userDepartmentId = useWorkspaceStore((s) => s.userDepartmentId);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);

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
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/[0.06] bg-[#0a0a0a]/80 px-2 backdrop-blur-xl lg:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setIsDrawerOpen(false)}
              className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all ${
                isActive ? "text-cyan-400" : "text-white/40 hover:text-white"
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
              pathname === marketingTab.href ? "text-cyan-400" : "text-white/40 hover:text-white"
            }`}
          >
            <marketingTab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{marketingTab.label}</span>
          </Link>
        )}

        {/* Keyboard Shortcuts Help */}
        <button
          onClick={() => setHelpOpen(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-md p-2 text-white/40 hover:text-white transition-all"
          title="Keyboard Shortcuts (⌘⇧/)"
        >
          <Keyboard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Help</span>
        </button>

        {/* Lists Button */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all ${
            isDrawerOpen ? "text-cyan-400" : "text-white/40 hover:text-white"
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

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Manage Shortcuts"
        appShortcuts={MANAGE_HELP_SHORTCUTS}
      />

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
              className="fixed bottom-16 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-white/[0.06] bg-[#0a0a0a]/95 p-6 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              {/* Drag Handle */}
              <div className="mb-6 flex items-center justify-center">
                <div className="h-1 w-12 rounded-full bg-white/20" />
              </div>

              {/* Quick Filters */}
              <div className="mb-6">
                <h3 className="mb-3 px-2 font-mono text-xs uppercase tracking-wider text-white/30">
                  Quick Access
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/tasks"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-white/50 transition-all active:scale-95 hover:bg-white/[0.04] hover:text-white/80"
                  >
                    <CheckSquare className="h-5 w-5 text-cyan-400/80" />
                    <span className="text-sm font-medium">All Tasks</span>
                  </Link>
                  <Link
                    href="/tasks?filter=starred"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-white/50 transition-all active:scale-95 hover:bg-white/[0.04] hover:text-white/80"
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
                    <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
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
                          className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] glass-subtle p-3 text-white/40"
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
                              ? "border-white/[0.10] bg-white/[0.10] text-white"
                              : "border-white/[0.06] glass-subtle text-white/50 hover:bg-white/[0.04] hover:text-white"
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
                    <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
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
                        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] glass-subtle p-3 text-white/50 transition-all active:scale-95 hover:bg-white/[0.04] hover:text-white"
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
                    <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
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
                            ? "border-white/[0.10] bg-white/[0.10] text-white"
                            : "border-white/[0.06] glass-subtle text-white/50 hover:bg-white/[0.04] hover:text-white"
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
              <div className="border-t border-white/[0.10] pt-4 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
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


