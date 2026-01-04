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
 * Provides sidebar navigation for desktop and bottom navigation for mobile.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-white/5 bg-[#050505]/95 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-white/5 px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 group-hover:border-cyan-500/30 transition-colors">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="font-semibold text-white tracking-tight">Prism Engine</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <NavItem href="/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>
          <NavItem href="/projects" icon={FolderKanban}>Projects</NavItem>
          <NavItem href="/brand" icon={Palette}>Branding</NavItem>
          <NavItem href="/generate" icon={Sparkles}>AI Kitchen</NavItem>
          <NavItem href="/videos" icon={Video}>Video Context</NavItem>
          
          <div className="my-4 border-t border-white/5" />
          
          <NavItem href="/subscription" icon={CreditCard}>Subscription</NavItem>
          <NavItem href="/settings" icon={Settings}>Settings</NavItem>
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-4 bg-black/20">
          <div className="flex items-center gap-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-2 ring-white/5",
                }
              }}
            />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">Account</p>
              <p className="text-xs text-white/50">Manage profile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-lg flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10">
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="font-semibold text-white tracking-tight">Prism</span>
        </Link>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            }
          }}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/10 bg-black/80 backdrop-blur-lg flex items-center justify-around px-2 pb-safe">
        <MobileNavItem href="/dashboard" icon={LayoutDashboard} label="Home" />
        <MobileNavItem href="/projects" icon={FolderKanban} label="Projects" />
        <div className="relative -top-5">
          <Link 
            href="/generate"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/20 border border-white/20 text-white"
          >
            <Sparkles className="h-6 w-6" />
          </Link>
        </div>
        <MobileNavItem href="/brand" icon={Palette} label="Brand" />
        <MobileNavItem href="/settings" icon={Settings} label="Settings" />
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
      className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/5 hover:text-white hover:shadow-[inset_3px_0_0_0_#06b6d4]"
    >
      <Icon className="h-4 w-4 transition-colors group-hover:text-cyan-400" />
      {children}
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
      className="flex flex-col items-center justify-center gap-1 p-2 text-white/50 hover:text-white transition-colors"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
