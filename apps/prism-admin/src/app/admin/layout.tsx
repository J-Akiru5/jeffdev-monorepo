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
    <div className="min-h-screen bg-void">
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
<<<<<<< Updated upstream
=======

function NavItem({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-all ${
        isActive
          ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-400"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-amber-400" : "group-hover:text-amber-400"}`} />
      <span className="flex-1">{children}</span>
      <ChevronRight className={`h-3 w-3 transition-opacity ${isActive ? "opacity-50" : "opacity-0 group-hover:opacity-50"}`} />
    </Link>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 p-2 text-white/50 hover:text-white transition-colors min-w-[60px]"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
>>>>>>> Stashed changes
