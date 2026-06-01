"use client";

/**
 * AdminSidebar
 * ------------
 * Desktop sidebar for the Admin app.
 * Shows different navigation sections depending on the current mode
 * ("manage" vs "agency") from the admin-sidebar-store.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useAdminSidebarStore } from "@/stores/admin-sidebar-store";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  Shield,
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Mail,
  Receipt,
  Calendar,
  FileText,
  Building2,
  ListTodo,
  Activity,
  UserCircle,
  MessageSquare,
  KeyRound,
  Package,
  Wrench,
  Briefcase,
  Globe,
  Send,
  Star,
  Clock,
  type LucideIcon,
} from "lucide-react";

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

function SectionGroup({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-5 mb-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider hover:text-white/50 transition-colors"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`}
        />
        {label}
      </button>
      {open && children}
    </div>
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

/** Agency-mode navigation sections — restructured with grouped sections */
function AgencyNav() {
  return (
    <>
      <NavItem href="/admin/agency/dashboard" icon={LayoutDashboard}>
        Dashboard
      </NavItem>

      {/* Content (CMS) */}
      <SectionGroup label="Content">
        <NavItem href="/admin/agency/content" icon={FileText}>
          About Page
        </NavItem>
        <NavItem href="/admin/agency/content/homepage" icon={Globe}>
          Homepage
        </NavItem>
        <NavItem href="/admin/agency/content/features" icon={Star}>
          Features
        </NavItem>
        <NavItem href="/admin/agency/content/contact" icon={Mail}>
          Contact
        </NavItem>
        <NavItem href="/admin/agency/content/quote" icon={Send}>
          Quote Form
        </NavItem>
        <NavItem href="/admin/agency/content/prism" icon={Shield}>
          Prism Page
        </NavItem>
        <NavItem href="/admin/agency/content/legal" icon={FileText}>
          Legal Pages
        </NavItem>
      </SectionGroup>

      {/* Services */}
      <NavItem href="/admin/agency/services" icon={Wrench}>
        Services
      </NavItem>

      {/* Works */}
      <SectionGroup label="Works">
        <NavItem href="/admin/agency/projects" icon={FolderKanban}>
          Projects
        </NavItem>
        <NavItem href="/admin/agency/case-studies" icon={Briefcase}>
          Case Studies
        </NavItem>
      </SectionGroup>

      {/* Products */}
      <SectionGroup label="Products">
        <NavItem href="/admin/products" icon={Package}>
          Product Templates
        </NavItem>
        <NavItem href="/admin/agency/pricing" icon={DollarSign}>
          Pricing
        </NavItem>
      </SectionGroup>

      {/* Community */}
      <SectionGroup label="Community">
        <NavItem href="/admin/agency/community" icon={Users}>
          Posts & Members
        </NavItem>
        <NavItem href="/admin/agency/releases" icon={FileText}>
          Releases
        </NavItem>
      </SectionGroup>

      {/* Inquiries */}
      <SectionGroup label="Inquiries">
        <NavItem href="/admin/agency/quotes" icon={Send}>
          Quotes
        </NavItem>
        <NavItem href="/admin/agency/messages" icon={MessageSquare}>
          Messages
        </NavItem>
        <NavItem href="/admin/agency/feedback" icon={Star}>
          Feedback
        </NavItem>
      </SectionGroup>

      {/* Operations */}
      <SectionGroup label="Operations">
        <NavItem href="/admin/agency/invoices" icon={Receipt}>
          Invoices
        </NavItem>
        <NavItem href="/admin/agency/calendar" icon={Calendar}>
          Calendar
        </NavItem>
        <NavItem href="/admin/agency/availability" icon={Clock}>
          Availability
        </NavItem>
      </SectionGroup>

      {/* Team */}
      <SectionGroup label="Team">
        <NavItem href="/admin/agency/users" icon={Users}>
          Members
        </NavItem>
        <NavItem href="/admin/agency/access" icon={KeyRound}>
          Access Control
        </NavItem>
      </SectionGroup>

      {/* System */}
      <SectionGroup label="System">
        <NavItem href="/admin/agency/settings" icon={Settings}>
          Settings
        </NavItem>
        <NavItem href="/admin/agency/profile" icon={UserCircle}>
          Profile
        </NavItem>
        <NavItem href="/admin/agency/audit" icon={Activity}>
          Audit Log
        </NavItem>
      </SectionGroup>
    </>
  );
}

function SidebarFooterClock() {
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);

      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      setDateStr(now.toLocaleDateString("en-US", options));
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex flex-col items-center justify-center py-2 px-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-center select-none">
      <span className="font-mono text-base font-semibold tracking-wider text-amber-400">
        {time}
      </span>
      <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider mt-0.5">
        {dateStr}
      </span>
    </div>
  );
}

interface AdminSidebarProps {
  isFounder: boolean;
}

export function AdminSidebar({ isFounder }: AdminSidebarProps) {
  const mode = useAdminSidebarStore((s) => s.mode);

  return (
    <aside className="hidden lg:flex fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 flex-col border-r border-white/5 bg-void">
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

      {/* Clock, Date and Settings */}
      <div className="border-t border-white/5 p-3 space-y-3">
        <SidebarFooterClock />
        <Link
          href="/admin/settings"
          className="group flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-4 w-4 text-white/70 transition-colors group-hover:text-amber-400" />
          <span className="flex-1">Settings</span>
          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
        </Link>
      </div>
    </aside>
  );
}
