import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { MobileNav } from "@/components/mobile-nav";
import { ProjectProvider } from "@/contexts/project-context";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { TourGuide } from "@/components/tour-guide";
import { resolveSyntaxureWorkspace } from "@/lib/workspace";
import { PERSONAL_LISTS } from "@/lib/schemas";
import type { Project } from "@/lib/schemas";

/**
 * Dashboard Layout
 * ----------------
 * Shell for all dashboard pages with sidebar and mobile nav.
 * Fetches workspace/RBAC data server-side and hydrates Zustand stores.
 * Includes @modal slot for intercepting slide-over routes.
 */

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // ── Fetch Workspaces & RBAC data ──

  // Resolve Syntaxure Labs workspace via shared cached utility
  const syntaxureData = await resolveSyntaxureWorkspace();

  // Get all workspace memberships for WorkspaceProvider (needs ALL workspaces, not just Syntaxure)
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, department_id, c_level_title, workspaces!inner(id, name, created_at)")
    .eq("user_id", user.id);

  const workspaces = (memberships || [])
    .filter((m: Record<string, unknown>) => m.workspaces != null)
    .map((m: Record<string, unknown>) => ({
      id: (m.workspaces as Record<string, unknown>).id as string,
      name: (m.workspaces as Record<string, unknown>).name as string,
      createdAt: (m.workspaces as Record<string, unknown>).created_at as string,
      role: m.role as string,
    }));

  const activeWorkspaceId = workspaces.length > 0 ? workspaces[0]!.id : null;

  // Derive Syntaxure-specific RBAC data from memberships using resolved workspace ID
  let departments: { id: string; workspaceId: string; name: string; createdAt: string }[] = [];
  let userRole: "founder" | "employee" = "employee";
  let userDepartmentId: string | null = null;
  let cpoUserId: string | null = null;
  let cLevelTitle: "ceo" | "cto" | "cpo" | "coo" | "cmo" | null = null;

  if (syntaxureData) {
    departments = syntaxureData.departments.map((d) => ({
      id: d.id,
      workspaceId: syntaxureData.workspaceId,
      name: d.name,
      createdAt: syntaxureData.createdAt,
    }));

    const membership = memberships?.find(
      (m: Record<string, unknown>) => m.workspace_id === syntaxureData.workspaceId,
    );
    userRole = (membership?.role as "founder" | "employee") || "employee";
    userDepartmentId = (membership?.department_id as string | null) || null;
    cLevelTitle = (membership?.c_level_title as "ceo" | "cto" | "cpo" | "coo" | "cmo" | null) || null;

    // Find the CPO: the member assigned to the Product department
    const productDept = departments.find((d) => d.name === "Product");
    if (productDept) {
      const { data: cpoMembership } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", syntaxureData.workspaceId)
        .eq("department_id", productDept.id)
        .maybeSingle();

      if (cpoMembership) {
        cpoUserId = String(cpoMembership.user_id);
      }
    }
  }

  return (
    <WorkspaceProvider
      workspaces={workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        createdAt: w.createdAt,
      }))}
      activeWorkspaceId={activeWorkspaceId}
      departments={departments}
      userRole={userRole}
      userDepartmentId={userDepartmentId}
      cpoUserId={cpoUserId}
      cLevelTitle={cLevelTitle}
    >
      <ProjectProvider initialProjects={getDefaultProjects()}>
        <div className="min-h-screen bg-surface">
          {/* Top Navigation Bar */}
          <TopNavbar />

          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Main Content */}
          <div className="ml-0 pt-14 transition-all duration-300 lg:ml-64">
            <main className="min-h-screen p-4 pb-24 lg:p-6 lg:pb-6">
              {children}
            </main>
          </div>

          {/* Tour Guide for new users */}
          <TourGuide />

          {/* Parallel Route Slot for Slide-over modals */}
          {modal}
        </div>
      </ProjectProvider>
    </WorkspaceProvider>
  );
}

/**
 * Generate default projects from the PERSONAL_LISTS constant.
 * These serve as initialized project data when no projects exist in Supabase yet.
 */
function getDefaultProjects(): Project[] {
  return PERSONAL_LISTS.map((list, i) => ({
    id: `list-${i + 1}`,
    name: list.name,
    color: list.color,
    order: i,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
