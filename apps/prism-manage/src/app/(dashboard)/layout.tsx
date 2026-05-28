import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ProjectProvider } from "@/contexts/project-context";
import { WorkspaceProvider } from "@/components/workspace-provider";
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

  // Get all workspace memberships for this user
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, department_id, workspaces!inner(id, name, created_at)")
    .eq("user_id", user.id);

  const workspaces = (memberships || []).map((m: Record<string, unknown>) => ({
    id: (m.workspaces as Record<string, unknown>).id as string,
    name: (m.workspaces as Record<string, unknown>).name as string,
    createdAt: (m.workspaces as Record<string, unknown>).created_at as string,
    role: m.role as string,
  }));

  // Default active workspace: first one found
  const activeWorkspaceId = workspaces.length > 0 ? workspaces[0]!.id : null;

  // Fetch departments for Syntaxure Labs workspace
  const syntaxureWorkspace = workspaces.find(
    (w) => w.name === "Syntaxure Labs" || w.name === "Syntaxure Labs, Inc."
  );

  let departments: { id: string; workspaceId: string; name: string; createdAt: string }[] = [];
  let userRole: "founder" | "employee" = "employee";
  let userDepartmentId: string | null = null;
  let cpoUserId: string | null = null;

  if (syntaxureWorkspace) {
    const { data: deptData } = await supabase
      .from("departments")
      .select("*")
      .eq("workspace_id", syntaxureWorkspace.id)
      .order("name", { ascending: true });

    departments = (deptData || []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      workspaceId: String(d.workspace_id),
      name: String(d.name),
      createdAt: String(d.created_at),
    }));

    // Get this user's role and department assignment
    const membership = memberships?.find(
      (m: Record<string, unknown>) => m.workspace_id === syntaxureWorkspace.id
    );
    userRole = (membership?.role as "founder" | "employee") || "employee";
    userDepartmentId = (membership?.department_id as string | null) || null;

    // Find the CPO: the member assigned to the Product department
    const productDept = departments.find((d) => d.name === "Product");
    if (productDept) {
      const { data: cpoMembership } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", syntaxureWorkspace.id)
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
    >
      <ProjectProvider initialProjects={getDefaultProjects()}>
        <div className="min-h-screen bg-surface">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Main Content */}
          <div className="ml-0 transition-all duration-300 lg:ml-64">
            <main className="min-h-screen p-4 pb-24 lg:p-6 lg:pb-6">
              {children}
            </main>
          </div>

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
