"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, User, Settings, Keyboard } from "lucide-react";
import { RealtimeClock } from "@syntaxure/ui";

interface SidebarBottomProps {
  collapsed: boolean;
  onHelpClick: () => void;
}

export function SidebarBottom({ collapsed, onHelpClick }: SidebarBottomProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="border-t border-white/[0.06] p-3 space-y-1">
      {!collapsed && <RealtimeClock />}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 ${
          collapsed ? "justify-center" : ""
        }`}
        title={collapsed ? "Toggle theme" : undefined}
      >
        {resolvedTheme === "theme-light" ? (
          <Moon className="h-4 w-4 flex-shrink-0" />
        ) : (
          <Sun className="h-4 w-4 flex-shrink-0" />
        )}
        {!collapsed && <span>{resolvedTheme === "theme-light" ? "Dark Mode" : "Light Mode"}</span>}
      </button>
      <Link
        href="/profile"
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 ${
          collapsed ? "justify-center" : ""
        }`}
        title={collapsed ? "Profile" : undefined}
      >
        <User className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>Profile</span>}
      </Link>
      <Link
        href="/settings"
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 ${
          collapsed ? "justify-center" : ""
        }`}
        title={collapsed ? "Settings" : undefined}
      >
        <Settings className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>Settings</span>}
      </Link>
      <button
        onClick={onHelpClick}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 ${
          collapsed ? "justify-center" : ""
        }`}
        title={collapsed ? "Keyboard Shortcuts (⌘⇧/)" : undefined}
      >
        <Keyboard className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>Keyboard Shortcuts</span>}
      </button>
    </div>
  );
}
