import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ProjectProvider } from "@/contexts/project-context";

/**
 * Dashboard Layout
 * ----------------
 * Shell for all dashboard pages with sidebar and mobile nav.
 */

// Mock initial projects for now (will be fetched from Firestore)
const mockProjects = [
  {
    id: "1",
    name: "My Tasks",
    color: "var(--color-cyan)",
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Academics",
    color: "var(--color-purple)",
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Student Council",
    color: "var(--color-emerald)",
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "USC",
    color: "var(--color-amber)",
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "SineAI Guild",
    color: "#ef4444",
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <ProjectProvider initialProjects={mockProjects}>
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
      </div>
    </ProjectProvider>
  );
}
