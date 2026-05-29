"use client";

/**
 * Sidebar Navigation
 * ------------------
 * Desktop sidebar showing workspace-aware navigation with RBAC.
 * - Personal Workspace: Shows personal lists (My Tasks, Academics, etc.)
 * - Syntaxure Labs Workspace: Shows 5 departments (founder) or 1 (employee)
 * - List CRUD: Hover context menu for edit/delete on list items
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Star,
  Calendar,
  LayoutGrid,
  Settings,
  User,
  Sun,
  Moon,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  TrendingUp,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Bot,
  LayoutDashboard,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { RealtimeClock } from "@/components/realtime-clock";
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
    Executive: "#8b5cf6",
    Engineering: "#06b6d4",
    Operations: "#f59e0b",
    Marketing: "#10b981",
    Product: "#3b82f6",
  };
  return colorMap[name] || "var(--color-cyan)";
}

/** Generate a unique id for new lists */
function generateId(): string {
  return `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const { projects, addProject, updateProject, removeProject, setActiveProjectId } = useProjects();

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

  // C-Level scoping: determines which department(s) this user can see
  const cLevelDepartment = cLevelTitle
    ? ({ ceo: null, cto: "Engineering", cpo: "Product", coo: "Operations", cmo: "Marketing" } as const)[cLevelTitle]
    : null;
  const isCLevelScoped = cLevelTitle !== null && cLevelTitle !== "ceo";

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const newListInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing or creating
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);
  useEffect(() => {
    if (showNewListInput && newListInputRef.current) newListInputRef.current.focus();
  }, [showNewListInput]);

  const visibleDepartments: Department[] = isFounder
    ? cLevelDepartment
      ? departments.filter((d) => d.name === cLevelDepartment)
      : departments
    : departments.filter((d) => d.id === userDepartmentId);

  const marketingDept = departments.find((d) => d.name === "Marketing");
  // Marketing link visible to: CEO, CMO, Marketing dept staff, unrefined founders
  const isMarketingMember = !!marketingDept && (
    cLevelTitle === "ceo" ||
    cLevelTitle === "cmo" ||
    (!cLevelTitle && isFounder) ||
    userDepartmentId === marketingDept.id
  );

  const isActive = (href: string) => {
    if (href.includes("?")) {
      return pathname + (typeof window !== "undefined" ? window.location.search : "") === href;
    }
    return pathname === href;
  };

  // ── List CRUD Handlers ──
  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      updateProject(id, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    if (confirm(`Delete "${project.name}"? Tasks in this list won't be deleted.`)) {
      removeProject(id);
    }
  };

  const handleCreateList = () => {
    if (newListName.trim()) {
      addProject({
        id: generateId(),
        name: newListName.trim(),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        order: projects.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setNewListName("");
      setShowNewListInput(false);
    }
  };

  // ── Render ──
  return (
    <aside
      className={`fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-border bg-surface transition-all duration-300 lg:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end border-b border-border px-4 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-glass-05 hover:text-text-primary"
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
            <h3 className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-text-quiet">
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
                        ? "bg-glass-10 text-text-primary"
                        : "text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
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
            <h3 className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-text-quiet">
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
                        ? "bg-glass-10 text-text-primary"
                        : "text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}

            {/* Marketing link */}
            {isMarketingMember && (
              <li key={marketingItem.href}>
                <Link
                  href={marketingItem.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                    isActive(marketingItem.href)
                      ? "bg-glass-10 text-text-primary"
                      : "text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
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
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-text-quiet">
                  Lists
                </h3>
                <button
                  onClick={() => setShowNewListInput(true)}
                  className="rounded p-1 text-text-quiet transition-colors hover:bg-glass-05 hover:text-text-primary"
                  title="Create new list"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
            <ul className="space-y-1">
              {/* New list inline input */}
              {showNewListInput && !collapsed && (
                <li className="px-1">
                  <div className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-2 py-1">
                    <input
                      ref={newListInputRef}
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateList();
                        if (e.key === "Escape") {
                          setShowNewListInput(false);
                          setNewListName("");
                        }
                      }}
                      placeholder="List name..."
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                    />
                    <button
                      onClick={handleCreateList}
                      className="rounded p-0.5 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewListInput(false);
                        setNewListName("");
                      }}
                      className="rounded p-0.5 text-text-muted hover:text-text-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )}

              {/* Project lists */}
              {projects.length > 0
                ? projects.map((project) => {
                    const active = pathname.includes(`/projects/${project.id}`);
                    const isEditing = editingId === project.id;

                    return (
                      <li key={project.id} className="group relative">
                        {isEditing && !collapsed ? (
                          <div className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 mx-1">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(project.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="flex-1 bg-transparent text-sm text-text-primary outline-none"
                            />
                            <button
                              onClick={() => handleSaveEdit(project.id)}
                              className="rounded p-0.5 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded p-0.5 text-text-muted hover:text-text-primary"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveProjectId(project.id)}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                              active
                                ? "bg-glass-10 text-text-primary"
                                : "text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
                            } ${collapsed ? "justify-center" : ""}`}
                            title={collapsed ? project.name : undefined}
                          >
                            <span
                              className="h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: project.color || "var(--color-cyan)" }}
                            />
                            {!collapsed && (
                              <span className="flex-1 truncate text-left">{project.name}</span>
                            )}
                            {/* Context menu button (visible on hover) */}
                            {!collapsed && (
                              <div
                                className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleStartEdit(project.id, project.name)}
                                  className="rounded p-0.5 text-text-muted hover:text-text-primary"
                                  title="Rename"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  className="rounded p-0.5 text-text-muted hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })
                : PERSONAL_LISTS.map((list) => {
                    const Icon = getPersonalListIcon(list.name);
                    return (
                      <li key={list.name}>
                        <button
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-tertiary transition-all hover:bg-glass-05 hover:text-text-primary ${
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
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-text-quiet">
                    Departments
                  </h3>
                </div>
                {isFounder && (
                  <button
                    className="rounded p-1 text-text-quiet hover:bg-glass-05 hover:text-text-primary"
                    title="Add department"
                  >
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
                          ? "bg-glass-10 text-text-primary"
                          : "text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
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
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-text-quiet">
                  Lists
                </h3>
                <button
                  onClick={() => setShowNewListInput(true)}
                  className="rounded p-1 text-text-quiet transition-colors hover:bg-glass-05 hover:text-text-primary"
                  title="Create new list"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
            <ul className="space-y-1">
              {showNewListInput && !collapsed && (
                <li className="px-1">
                  <div className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-2 py-1">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateList();
                        if (e.key === "Escape") {
                          setShowNewListInput(false);
                          setNewListName("");
                        }
                      }}
                      placeholder="List name..."
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                    />
                    <button onClick={handleCreateList} className="rounded p-0.5 text-emerald-400 hover:text-emerald-300">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setShowNewListInput(false); setNewListName(""); }}
                      className="rounded p-0.5 text-text-muted hover:text-text-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )}
              {projects.map((project) => {
                const active = pathname.includes(`/projects/${project.id}`);
                const isEditing = editingId === project.id;

                return (
                  <li key={project.id} className="group relative">
                    {isEditing && !collapsed ? (
                      <div className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 mx-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(project.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 bg-transparent text-sm text-text-primary outline-none"
                        />
                        <button onClick={() => handleSaveEdit(project.id)} className="rounded p-0.5 text-emerald-400 hover:text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded p-0.5 text-text-muted hover:text-text-primary">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveProjectId(project.id)}
                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                          active
                            ? "bg-glass-10 text-text-primary"
                            : "text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? project.name : undefined}
                      >
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: project.color || "var(--color-cyan)" }}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-left">{project.name}</span>
                            <div
                              className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleStartEdit(project.id, project.name)}
                                className="rounded p-0.5 text-text-muted hover:text-text-primary"
                                title="Rename"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="rounded p-0.5 text-text-muted hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-1">
        {!collapsed && <RealtimeClock />}
        <button
          onClick={() => setTheme(theme === "dark" || theme === "system" ? "theme-light" : "dark")}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-tertiary transition-all hover:bg-glass-05 hover:text-text-primary ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Toggle theme" : undefined}
        >
          {theme === "theme-light" ? (
            <Moon className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Sun className="h-4 w-4 flex-shrink-0" />
          )}
          {!collapsed && <span>{theme === "theme-light" ? "Dark Mode" : "Light Mode"}</span>}
        </button>
        <Link
          href="/profile"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-tertiary transition-all hover:bg-glass-05 hover:text-text-primary ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Profile" : undefined}
        >
          <User className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Profile</span>}
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-tertiary transition-all hover:bg-glass-05 hover:text-text-primary ${
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
