"use client";

/**
 * Sidebar Navigation
 * ------------------
 * Desktop sidebar with Syntaxure Labs branding, glass morphism styling,
 * and workspace-aware navigation with RBAC.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Star,
  Calendar,
  LayoutGrid,
  TrendingUp,
  Building2,
  FolderKanban,
  BookOpen,
  Users,
  GraduationCap,
  Bot,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { KeyboardShortcutsHelp } from "@syntaxure/ui";
import { MANAGE_HELP_SHORTCUTS, MODE_TOGGLE_SHORTCUT } from "@/lib/keyboard-shortcuts";
import { useManageModeStore } from "@/stores/manage-mode-store";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { PERSONAL_LISTS } from "@/lib/schemas";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarSection } from "./sidebar-section";
import { SidebarInlineInput } from "./sidebar-inline-input";
import { SidebarProjectItem } from "./sidebar-project-item";
import { SidebarDepartments } from "./sidebar-departments";
import { SidebarBottom } from "./sidebar-bottom";
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

function generateId(): string {
  return `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { projects, addProject, updateProject, setActiveProjectId } = useProjects();

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const departments = useWorkspaceStore((s) => s.departments);
  const userRole = useWorkspaceStore((s) => s.userRole);
  const userDepartmentId = useWorkspaceStore((s) => s.userDepartmentId);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);

  const manageMode = useManageModeStore((s) => s.mode);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isSyntaxureLabs = activeWorkspace?.name === "Syntaxure Labs" || activeWorkspace?.name === "Syntaxure Labs, Inc.";
  const isPersonal = activeWorkspace?.name === "Personal";
  const isFounder = userRole === "founder";

  const cLevelDepartment = cLevelTitle
    ? ({ ceo: null, cto: "Engineering", cpo: "Product", coo: "Operations", cmo: "Marketing" } as const)[cLevelTitle]
    : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState("");

  const visibleDepartments: Department[] = isFounder
    ? cLevelDepartment
      ? departments.filter((d) => d.name === cLevelDepartment)
      : departments
    : departments.filter((d) => d.id === userDepartmentId);

  const marketingDept = departments.find((d) => d.name === "Marketing");
  const isMarketingMember = !!marketingDept && (
    cLevelTitle === "ceo" ||
    cLevelTitle === "cmo" ||
    (!cLevelTitle && isFounder) ||
    userDepartmentId === marketingDept.id
  );

  const isActive = (href: string) => {
    if (href.includes("?")) {
      return pathname === href.split("?")[0];
    }
    return pathname === href;
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

  const renderProjectLists = () => (
    <>
      {showNewListInput && !collapsed && (
        <SidebarInlineInput
          value={newListName}
          onChange={setNewListName}
          onSave={handleCreateList}
          onCancel={() => { setShowNewListInput(false); setNewListName(""); }}
          placeholder="List name..."
        />
      )}
      {projects.map((project) => (
        <SidebarProjectItem
          key={project.id}
          project={project}
          active={pathname.includes(`/projects/${project.id}`)}
          collapsed={collapsed}
          editing={editingId === project.id}
          editName={editName}
          onEditNameChange={setEditName}
          onStartEdit={() => { setEditingId(project.id); setEditName(project.name); }}
          onSaveEdit={() => {
            if (editName.trim()) updateProject(project.id, { name: editName.trim() });
            setEditingId(null);
            setEditName("");
          }}
          onCancelEdit={() => setEditingId(null)}
          onSelect={() => setActiveProjectId(project.id)}
        />
      ))}
    </>
  );

  return (
    <aside
      className={`fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl transition-all duration-300 lg:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end border-b border-white/[0.06] px-4 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Quick Filters — Focus mode */}
        {manageMode === "focus" && (
          <SidebarSection title="Quick Access" collapsed={collapsed}>
            {quickFilters.map((item) => (
              <SidebarNavItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </SidebarSection>
        )}

        {/* Views — Focus mode */}
        {manageMode === "focus" && (
          <SidebarSection title="Views" collapsed={collapsed}>
            {views.map((item) => (
              <SidebarNavItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
            {isMarketingMember && (
              <SidebarNavItem
                label={marketingItem.label}
                href={marketingItem.href}
                icon={marketingItem.icon}
                active={isActive(marketingItem.href)}
                collapsed={collapsed}
              />
            )}
          </SidebarSection>
        )}

        {/* Personal Lists */}
        {(isPersonal || !activeWorkspace) && (
          <SidebarSection
            title="Lists"
            collapsed={collapsed}
            action={
              !collapsed ? (
                <button
                  onClick={() => setShowNewListInput(true)}
                  className="rounded p-1 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
                  title="Create new list"
                >
                  <Plus className="h-3 w-3" />
                </button>
              ) : undefined
            }
          >
            {renderProjectLists()}
            {projects.length === 0 &&
              PERSONAL_LISTS.map((list) => {
                const Icon = getPersonalListIcon(list.name);
                return (
                  <li key={list.name}>
                    <button
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 ${
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
          </SidebarSection>
        )}

        {/* Departments */}
        {isSyntaxureLabs && (
          <SidebarSection title="Departments" collapsed={collapsed} icon={Building2}>
            <SidebarDepartments
              departments={visibleDepartments}
              collapsed={collapsed}
              isFounder={isFounder}
            />
          </SidebarSection>
        )}

        {/* Legacy Project Lists */}
        {!isPersonal && !isSyntaxureLabs && projects.length > 0 && (
          <SidebarSection
            title="Lists"
            collapsed={collapsed}
            action={
              !collapsed ? (
                <button
                  onClick={() => setShowNewListInput(true)}
                  className="rounded p-1 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
                  title="Create new list"
                >
                  <Plus className="h-3 w-3" />
                </button>
              ) : undefined
            }
          >
            {renderProjectLists()}
          </SidebarSection>
        )}

        {/* Mode indicator in sidebar footer */}
        <div className="border-t border-white/[0.06] px-4 py-3">
          <button
            onClick={() => useManageModeStore.getState().toggleMode()}
            className="flex w-full items-center gap-2 text-[11px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
            title={`Switch to ${manageMode === "focus" ? "Workspace" : "Focus"} mode (⌘⇧M)`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                manageMode === "focus" ? "bg-purple-400" : "bg-amber-400"
              }`}
            />
            <span className="capitalize">{manageMode} mode</span>
            <span className="text-[10px] text-[var(--text-tertiary)]/50">⌘⇧M</span>
          </button>
        </div>
      </nav>

      {/* Bottom Section */}
      <SidebarBottom collapsed={collapsed} onHelpClick={() => setHelpOpen(true)} />

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Manage Shortcuts"
        appShortcuts={[...MANAGE_HELP_SHORTCUTS, MODE_TOGGLE_SHORTCUT]}
      />
    </aside>
  );
}
