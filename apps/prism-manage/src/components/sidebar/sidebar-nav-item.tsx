"use client";

import Link from "next/link";

interface SidebarNavItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

export function SidebarNavItem({
  label,
  href,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: SidebarNavItemProps) {
  const content = (
    <div
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
        active
          ? "bg-cyan-500/10 text-white border-l-2 border-cyan-500"
          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80 border-l-2 border-transparent"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </div>
  );

  if (onClick) {
    return (
      <li>
        <button
          onClick={onClick}
          className="w-full text-left"
          title={collapsed ? label : undefined}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        title={collapsed ? label : undefined}
      >
        {content}
      </Link>
    </li>
  );
}
