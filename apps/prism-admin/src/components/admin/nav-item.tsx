"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function NavItem({ href, icon: Icon, children }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition-all ${
        isActive
          ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-400"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-amber-400" : "group-hover:text-amber-400"}`} />
      <span className="flex-1">{children}</span>
      <ChevronRight className={`h-3 w-3 transition-opacity ${isActive ? "opacity-50" : "opacity-0 group-hover:opacity-50"}`} />
    </Link>
  );
}

interface MobileNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function MobileNavItem({ href, icon: Icon, label }: MobileNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors min-w-[60px] ${
        isActive ? "text-amber-400" : "text-white/50 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
