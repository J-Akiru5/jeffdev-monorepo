import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminErrorBoundary } from "@/components/admin/error-boundary-wrapper";
import { AdminTopNavbar } from "./top-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

/**
 * Admin Layout
 * Mobile-first with Android-style bottom navigation
 *
 * Now features a shared top navbar (AppTopNavbar) on all screen sizes.
 * The desktop sidebar sits below the navbar at `top-14`.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "employee";

  // Check if user has admin access
  const allowedRoles = ["founder", "admin", "manager"];
  if (!allowedRoles.includes(role)) {
    redirect("/unauthorized");
  }

  const isFounder = role === "founder";

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Shared Top Navbar (all screen sizes) */}
      <AdminTopNavbar />

      {/* Desktop Sidebar */}
      <AdminSidebar isFounder={isFounder} />

      {/* Main Content */}
      <main className="lg:ml-60 pt-14 pb-20 lg:pb-0">
        <div className="min-h-screen p-4 lg:p-6">
          <AdminErrorBoundary>{children}</AdminErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav />
    </div>
  );
}
