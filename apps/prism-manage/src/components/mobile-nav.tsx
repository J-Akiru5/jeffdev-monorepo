"use client";

/**
 * Mobile Bottom Navigation
 * ------------------------
 * Fixed bottom tab bar for mobile devices.
 * Shows primary views + "Lists" drawer.
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
import { createClient } from "@/lib/supabase/browser";

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
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-white/50 transition-colors hover:bg-white/5 hover:text-red-400"
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

  const tabs = [
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Kanban", href: "/kanban", icon: LayoutGrid },
    { label: "Mktg", href: "/marketing", icon: CheckSquare },
  ];

  const handleProjectClick = (projectId: string) => {
    setActiveProjectId(projectId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/6 bg-void/80 px-2 backdrop-blur-xl lg:hidden">
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
              className="fixed bottom-16 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0A0A0A] p-6 shadow-2xl lg:hidden"
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
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-white/60 transition-all active:scale-95 hover:bg-white/5 hover:text-white"
                  >
                    <CheckSquare className="h-5 w-5 text-cyan-500/80" />
                    <span className="text-sm font-medium">All Tasks</span>
                  </Link>
                  <Link
                    href="/tasks?filter=starred"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-white/60 transition-all active:scale-95 hover:bg-white/5 hover:text-white"
                  >
                    <Star className="h-5 w-5 text-yellow-500/80" />
                    <span className="text-sm font-medium">Starred</span>
                  </Link>
                </div>
              </div>

              {/* Project Lists */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between px-2">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-white/30">
                    Your Lists
                  </h3>
                  <button className="rounded-lg p-2 text-cyan-400 hover:bg-cyan-400/10">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <p className="px-2 text-sm text-white/30">
                      No lists yet. Create one to get started.
                    </p>
                  ) : (
                    projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all active:scale-95 ${
                          activeProjectId === project.id
                            ? "border-white/10 bg-white/10 text-white"
                            : "border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: project.color || "#06b6d4",
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

              {/* Settings & Sign Out */}
              <div className="border-t border-white/10 pt-4 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
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
