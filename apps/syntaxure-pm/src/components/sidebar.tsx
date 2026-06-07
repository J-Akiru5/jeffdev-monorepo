"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  {
    label: "Documentation",
    icon: FileText,
    children: [
      { href: "/docs/architecture", label: "Architecture" },
      { href: "/docs/apps", label: "Apps" },
      { href: "/docs/packages", label: "Packages" },
      { href: "/docs/database", label: "Database" },
      { href: "/docs/database/schema", label: "Schema Explorer" },
      { href: "/docs/workflows", label: "Workflows" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-black/20">
      <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <span className="text-sm font-semibold text-white">Syntaxure PM</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) =>
            "children" in item ? (
              <div key={item.label} className="mt-4">
                <div className="mb-2 flex items-center gap-2 px-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <div className="space-y-0.5">
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={clsx(
                        "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                        isActive(child.href)
                          ? "sidebar-active bg-violet-500/10 text-violet-400"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive(item.href)
                    ? "sidebar-active bg-violet-500/10 text-violet-400"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          )}
        </div>
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <Link
          href="/settings"
          className={clsx(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            isActive("/settings")
              ? "sidebar-active bg-violet-500/10 text-violet-400"
              : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
