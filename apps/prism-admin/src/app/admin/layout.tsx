import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountDropdownWrapper } from "@/components/auth/account-dropdown-wrapper";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { AdminErrorBoundary } from "@/components/admin/error-boundary-wrapper";
import { AdminTopNavbar } from "./top-navbar";
import { AdminMobileHelpButton } from "@/components/admin/mobile-help-button";
import { AdminSidebarHelpButton } from "@/components/admin/sidebar-help-button";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Mail,
  FolderKanban,
  Settings,
  Shield,
  ChevronRight,
  Receipt,
  Calendar,
  FileText,
  Clock,
  Building2,
  ListTodo,
  Activity,
  UserCircle,
  MessageSquare,
  KeyRound,
  PlusCircle,
  ClipboardList,
  Package,
  Wrench,
} from "lucide-react";

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
      <aside className="hidden lg:flex fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 flex-col border-r border-white/5 bg-[#030303]">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-white/5 px-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/20 border border-amber-500/30">
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm">
                Prism Admin
              </span>
              <span className="block text-[10px] text-amber-400/80 font-mono uppercase tracking-wider">
                Mission Control
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
              Overview
            </span>
          </div>
          <NavItem href="/admin/dashboard" icon={LayoutDashboard}>
            Dashboard
          </NavItem>

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
              Prism Engine
            </span>
          </div>
          <NavItem href="/admin/users" icon={Users}>
            Engine Users
          </NavItem>
          <NavItem href="/admin/subscriptions" icon={CreditCard}>
            Subscriptions
          </NavItem>
          <NavItem href="/admin/pricing" icon={DollarSign}>
            Pricing
          </NavItem>

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
              Products
            </span>
          </div>
          <NavItem href="/admin/products" icon={Package}>
            Product Templates
          </NavItem>
          <NavItem href="/admin/customization-services" icon={Wrench}>
            Customization
          </NavItem>

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
              Agency
            </span>
          </div>
          <NavItem href="/admin/agency/dashboard" icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem href="/admin/agency/projects" icon={FolderKanban}>
            Projects
          </NavItem>
          <NavItem href="/admin/agency/quotes" icon={Mail}>
            Quotes
          </NavItem>
          <NavItem href="/admin/agency/invoices" icon={Receipt}>
            Invoices
          </NavItem>
          <NavItem href="/admin/agency/calendar" icon={Calendar}>
            Calendar
          </NavItem>
          <NavItem href="/admin/agency/users" icon={Users}>
            Team Members
          </NavItem>
          <NavItem href="/admin/agency/content" icon={FileText}>
            Content
          </NavItem>
          <NavItem href="/admin/agency/releases" icon={FileText}>
            Releases
          </NavItem>
          <NavItem href="/admin/agency/community" icon={Users}>
            Community
          </NavItem>
          <NavItem href="/admin/agency/services" icon={Wrench}>
            Services Catalog
          </NavItem>
          <NavItem href="/admin/agency/case-studies" icon={FileText}>
            Case Studies
          </NavItem>
          <NavItem href="/admin/agency/feedback" icon={Mail}>
            Feedback
          </NavItem>
          <NavItem href="/admin/agency/messages" icon={MessageSquare}>
            Messages
          </NavItem>

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
              Management
            </span>
          </div>
          <NavItem href="/admin/agency/projects/new" icon={PlusCircle}>
            New Project
          </NavItem>
          <NavItem href="/admin/agency/invoices/new" icon={ClipboardList}>
            New Invoice
          </NavItem>
          <NavItem href="/admin/agency/profile" icon={UserCircle}>
            Profile
          </NavItem>
          <NavItem href="/admin/agency/access" icon={KeyRound}>
            Access Control
          </NavItem>
          <NavItem href="/admin/agency/audit" icon={Activity}>
            Audit Log
          </NavItem>
          <NavItem href="/admin/agency/availability" icon={Clock}>
            Availability
          </NavItem>

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
              Prism Manage
            </span>
          </div>
          <NavItem href="/admin/workspaces" icon={Building2}>
            Workspaces
          </NavItem>
          <NavItem href="/admin/manage-projects" icon={ListTodo}>
            All Projects
          </NavItem>

          {isFounder && (
            <>
              <div className="px-3 mt-4 mb-2">
                <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
                  System
                </span>
              </div>
              <NavItem href="/admin/settings" icon={Settings}>
                Settings
              </NavItem>
            </>
          )}
        </nav>

        {/* User & Theme */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <ThemeToggle />
          <AdminSidebarHelpButton />
          <AccountDropdownWrapper />
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-60 pt-14 pb-20 lg:pb-0">
        <div className="min-h-screen p-4 lg:p-6">
          <AdminErrorBoundary>{children}</AdminErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/10 bg-[#030303]/95 backdrop-blur-lg flex items-center justify-around px-2 pb-safe">
        <MobileNavItem
          href="/admin/dashboard"
          icon={LayoutDashboard}
          label="Home"
        />
        <MobileNavItem
          href="/admin/agency/dashboard"
          icon={FolderKanban}
          label="Agency"
        />
        <div className="relative -top-4">
          <Link
            href="/admin/agency/inquiries"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 border border-white/20 text-white"
          >
            <Mail className="h-5 w-5" />
          </Link>
        </div>
        <MobileNavItem href="/admin/users" icon={Users} label="Engine" />
        <AdminMobileHelpButton />
        <MobileNavItem
          href="/admin/agency/calendar"
          icon={Calendar}
          label="Calendar"
        />
      </nav>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4 transition-colors group-hover:text-amber-400" />
      <span className="flex-1">{children}</span>
      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
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
