import { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Palette, 
  Sparkles, 
  CreditCard,
  Settings,
  Video
} from "lucide-react";

/**
 * Dashboard Layout
 * Provides sidebar navigation for the Prism Context Engine dashboard.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-[#050505]">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-white/5 px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="font-semibold text-white">Prism Context Engine</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <NavItem href="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </NavItem>
            <NavItem href="/projects" icon={FolderKanban}>
              Projects
            </NavItem>
            <NavItem href="/brand" icon={Palette}>
              Branding
            </NavItem>
            <NavItem href="/generate" icon={Sparkles}>
              AI Kitchen
            </NavItem>
            <NavItem href="/videos" icon={Video}>
              Video Context
            </NavItem>
            
            <div className="my-4 border-t border-white/5" />
            
            <NavItem href="/subscription" icon={CreditCard}>
              Subscription
            </NavItem>
            <NavItem href="/settings" icon={Settings}>
              Settings
            </NavItem>
          </nav>

          {/* User */}
          <div className="border-t border-white/5 p-4">
            <div className="flex items-center gap-3">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  }
                }}
              />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-white truncate">Account</p>
                <p className="text-xs text-white/50">Manage profile</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
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
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
