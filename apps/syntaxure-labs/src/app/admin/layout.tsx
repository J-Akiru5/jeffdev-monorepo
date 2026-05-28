import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { UserProvider } from "@/contexts/user-context";
import { ThemeDefaultSync } from "@/components/admin/theme-default-sync";

/**
 * Admin Layout
 * -------------
 * Layout wrapper for all /admin pages.
 * Includes sidebar navigation and header.
 * Syncs cross-app theme default from user_profiles.preferences.
 * Toaster is provided by root layout.
 */

import { MobileNav } from "@/components/admin/mobile-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <ThemeDefaultSync />
      <div className="min-h-screen bg-void">
        {/* Desktop Sidebar */}
        <AdminSidebar />

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content */}
        <div className="ml-0 transition-all duration-300 lg:ml-64">
          <AdminHeader />
          {/* Add padding bottom for mobile nav clearance */}
          <main className="p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
