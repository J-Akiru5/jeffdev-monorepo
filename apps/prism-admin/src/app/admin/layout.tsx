import { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Mail,
  FolderKanban,
  Building2,
  Settings,
  Shield,
  ChevronRight
} from "lucide-react";

/**
 * Admin Layout
 * Mobile-first with Android-style bottom navigation
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string })?.role || "user";
  const isFounder = role === "founder";
  const isAdmin = role === "admin" || isFounder;

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-white/5 bg-[#030303]">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-white/5 px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/20 border border-amber-500/30">
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm">Prism Admin</span>
              <span className="block text-[10px] text-amber-400/80 font-mono uppercase tracking-wider">Mission Control</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Overview</span>
          </div>
          <NavItem href="/admin/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Prism Engine</span>
          </div>
          <NavItem href="/admin/users" icon={Users}>Users</NavItem>
          <NavItem href="/admin/subscriptions" icon={CreditCard}>Subscriptions</NavItem>

          <div className="px-3 mt-4 mb-2">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Agency</span>
          </div>
          <NavItem href="/admin/inquiries" icon={Mail}>Inquiries</NavItem>
          <NavItem href="/admin/projects" icon={FolderKanban}>Projects</NavItem>
          <NavItem href="/admin/clients" icon={Building2}>Clients</NavItem>

          {isFounder && (
            <>
              <div className="px-3 mt-4 mb-2">
                <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">System</span>
              </div>
              <NavItem href="/admin/settings" icon={Settings}>Settings</NavItem>
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 p-2 rounded-md bg-white/[0.02]">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-[10px] text-amber-400 font-mono uppercase">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/5 bg-[#030303]/95 backdrop-blur-lg flex items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/20 border border-amber-500/30">
            <Shield className="h-4 w-4 text-amber-400" />
          </div>
          <span className="font-semibold text-white text-sm">Admin</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-amber-400 font-mono uppercase bg-amber-500/10 px-2 py-1 rounded">{role}</span>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              }
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-60 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="min-h-screen p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/10 bg-[#030303]/95 backdrop-blur-lg flex items-center justify-around px-2 pb-safe">
        <MobileNavItem href="/admin/dashboard" icon={LayoutDashboard} label="Home" />
        <MobileNavItem href="/admin/users" icon={Users} label="Users" />
        <div className="relative -top-4">
          <Link 
            href="/admin/inquiries"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 border border-white/20 text-white"
          >
            <Mail className="h-5 w-5" />
          </Link>
        </div>
        <MobileNavItem href="/admin/subscriptions" icon={CreditCard} label="Subs" />
        <MobileNavItem href="/admin/projects" icon={FolderKanban} label="Projects" />
      </nav>
    </div>
  );
}

function NavItem({ 
  href, 
  icon: Icon, 
  children 
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
  label
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
