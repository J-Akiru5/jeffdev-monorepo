"use client";

/**
 * AdminMobileNav
 * --------------
 * Mobile bottom navigation for the Admin app.
 * Shows different tabs depending on the current mode ("manage" vs "agency")
 * from the admin-sidebar-store.
 */

import Link from "next/link";
import { AdminMobileHelpButton } from "@/components/admin/mobile-help-button";
import { useAdminSidebarStore } from "@/stores/admin-sidebar-store";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Mail,
  Calendar,
  Building2,
  Package,
  type LucideIcon,
} from "lucide-react";

interface MobileTab {
  label: string;
  href: string;
  icon: LucideIcon;
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
}: MobileTab) {
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

export function AdminMobileNav() {
  const mode = useAdminSidebarStore((s) => s.mode);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/10 bg-[#030303]/95 backdrop-blur-lg flex items-center justify-around px-2 pb-safe">
      {/* Home — always visible */}
      <MobileNavItem href="/admin/dashboard" icon={LayoutDashboard} label="Home" />

      {mode === "agency" ? (
        <>
          <MobileNavItem href="/admin/agency/dashboard" icon={FolderKanban} label="Agency" />
          <div className="relative -top-4">
            <Link
              href="/admin/inquiries"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 border border-white/20 text-white"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
          <MobileNavItem href="/admin/agency/calendar" icon={Calendar} label="Calendar" />
        </>
      ) : (
        <>
          <MobileNavItem href="/admin/users" icon={Users} label="Engine" />
          <MobileNavItem href="/admin/workspaces" icon={Building2} label="Workspaces" />
          <MobileNavItem href="/admin/products" icon={Package} label="Products" />
        </>
      )}

      <AdminMobileHelpButton />
    </nav>
  );
}
