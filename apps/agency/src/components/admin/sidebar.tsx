'use client';

/**
 * Admin Sidebar Navigation
 * -------------------------
 * Professional sidebar with role-based menu items.
 * Collapsible on mobile.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Wrench,
  FolderKanban,
  MessageSquare,
  Mail,
  Star,
  Receipt,
  RefreshCcw,
  Users,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  User,
  Layers,
} from 'lucide-react';
import { logout } from '@/app/actions/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  minRole?: 'founder' | 'admin' | 'partner' | 'employee';
}

export const navSections: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Services', href: '/admin/services', icon: Wrench },
      { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
      { label: 'Case Studies', href: '/admin/case-studies', icon: Layers },
    ],
  },
  {
    title: 'Leads',
    items: [
      { label: 'Quotes', href: '/admin/quotes', icon: MessageSquare },
      { label: 'Messages', href: '/admin/messages', icon: Mail },
      { label: 'Feedback', href: '/admin/feedback', icon: Star },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Invoices', href: '/admin/invoices', icon: Receipt },
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: RefreshCcw },
    ],
    minRole: 'partner',
  },
  {
    title: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Access', href: '/admin/access', icon: Shield },
      { label: 'Audit Log', href: '/admin/audit', icon: Activity },
    ],
    minRole: 'admin',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // TODO: Get user role from context
  const userRole = 'founder';

  const roleLevel = { founder: 4, admin: 3, partner: 2, employee: 1 };
  const userLevel = roleLevel[userRole as keyof typeof roleLevel] || 1;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/6 bg-void transition-all duration-300 lg:flex ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-md">
              <img
                src="/favicon.svg"
                alt="JD Studio"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-semibold text-white">JD Studio</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => {
          // Check role access
          if (section.minRole) {
            const minLevel = roleLevel[section.minRole];
            if (userLevel < minLevel) return null;
          }

          return (
            <div key={section.title || 'main'} className="mb-6">
              {section.title && !collapsed && (
                <h3 className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-white/30">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                        } ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section: Profile, Settings, Visit Site, Logout */}
      <div className="border-t border-white/[0.06] p-3">
        {/* Settings */}
        <Link
          href="/admin/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Profile */}
        <Link
          href="/admin/profile"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Profile' : undefined}
        >
          <User className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Profile</span>}
        </Link>

        {/* Visit Public Site */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Visit Site' : undefined}
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Visit Site</span>}
        </a>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-400/70 transition-all hover:bg-red-500/10 hover:text-red-400 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
