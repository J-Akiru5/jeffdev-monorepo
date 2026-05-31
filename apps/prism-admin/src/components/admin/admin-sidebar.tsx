"use client";

/**
 * AdminSidebar
 * ------------
 * Desktop sidebar for the Admin app.
 * Shows different navigation sections depending on the current mode
 * ("manage" vs "agency") from the admin-sidebar-store.
 */

import Link from "next/link";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { AdminSidebarHelpButton } from "@/components/admin/sidebar-help-button";
import { AccountDropdownWrapper } from "@/components/auth/account-dropdown-wrapper";
import { useAdminSidebarStore } from "@/stores/admin-sidebar-store";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  Shield,
  ChevronRight,
  FolderKanban,
  Mail,
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
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

function NavItem({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: LucideIcon;
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

/** Shared navigation section — always visible regardless of mode */
function SharedNav() {
  return (
    <>
      <div className="px-3 mb-2">
        <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
          Overview
        </span>
      </div>
      <NavItem href="/admin/dashboard" icon={LayoutDashboard}>
        Dashboard
      </NavItem>
    </>
  );
}

/** Manage-mode navigation sections */
function ManageNav({ isFounder }: { isFounder: boolean }) {
  return (
    <>
      {/* Prism Engine */}
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

      {/* Products */}
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

      {/* Prism Manage */}
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

      {/* System (founder-only) */}
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
    </>
  );
}

/** Agency-mode navigation sections */
function AgencyNav() {
  return (
    <>
      {/* Agency */}
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

      {/* Management */}
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
    </>
  );
}

interface AdminSidebarProps {
  isFounder: boolean;
}

export function AdminSidebar({ isFounder }: AdminSidebarProps) {
  const mode = useAdminSidebarStore((s) => s.mode);

  return (
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
              {mode === "manage" ? "Manage" : "Agency"}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <SharedNav />

        {mode === "manage" ? (
          <ManageNav isFounder={isFounder} />
        ) : (
          <AgencyNav />
        )}
      </nav>

      {/* User & Theme */}
      <div className="border-t border-white/5 p-3 space-y-1">
        <ThemeToggle />
        <AdminSidebarHelpButton />
        <AccountDropdownWrapper />
      </div>
    </aside>
  );
}
