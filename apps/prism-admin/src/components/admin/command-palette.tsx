"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  FolderKanban,
  Settings,
  Shield,
  Mail,
  Receipt,
  FileText,
  Building2,
  Wrench,
} from "lucide-react";
import { cn } from "@syntaxure/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

// ─── Commands ────────────────────────────────────────────────────────────────

const COMMANDS: CommandItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "overview", "stats"],
  },
  {
    id: "users",
    label: "Engine Users",
    href: "/admin/users",
    icon: Users,
    keywords: ["users", "accounts", "members"],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
    keywords: ["billing", "plans", "payments"],
  },
  {
    id: "pricing",
    label: "Pricing Plans",
    href: "/admin/pricing",
    icon: CreditCard,
    keywords: ["plans", "tiers", "pricing"],
  },
  {
    id: "products",
    label: "Product Templates",
    href: "/admin/products",
    icon: Package,
    keywords: ["products", "templates"],
  },
  {
    id: "workspaces",
    label: "Workspaces",
    href: "/admin/workspaces",
    icon: Building2,
    keywords: ["workspaces", "organizations", "teams"],
  },
  {
    id: "projects",
    label: "Manage Projects",
    href: "/admin/manage-projects",
    icon: FolderKanban,
    keywords: ["projects", "all projects"],
  },
  {
    id: "agency-dashboard",
    label: "Agency Dashboard",
    href: "/admin/agency/dashboard",
    icon: LayoutDashboard,
    keywords: ["agency", "overview", "stats"],
  },
  {
    id: "agency-projects",
    label: "Agency Projects",
    href: "/admin/agency/projects",
    icon: FolderKanban,
    keywords: ["agency projects", "client projects"],
  },
  {
    id: "agency-quotes",
    label: "Quotes",
    href: "/admin/agency/quotes",
    icon: Mail,
    keywords: ["quotes", "estimates", "proposals"],
  },
  {
    id: "agency-invoices",
    label: "Invoices",
    href: "/admin/agency/invoices",
    icon: Receipt,
    keywords: ["invoices", "bills"],
  },
  {
    id: "agency-community",
    label: "Community",
    href: "/admin/agency/community",
    icon: Users,
    keywords: ["community", "members"],
  },
  {
    id: "agency-services",
    label: "Services Catalog",
    href: "/admin/agency/services",
    icon: Wrench,
    keywords: ["services", "catalog"],
  },
  {
    id: "agency-releases",
    label: "Releases",
    href: "/admin/agency/releases",
    icon: FileText,
    keywords: ["releases", "changelog"],
  },
  {
    id: "agency-content",
    label: "Content",
    href: "/admin/agency/content",
    icon: FileText,
    keywords: ["content", "pages"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    keywords: ["settings", "preferences", "config"],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? COMMANDS.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.keywords.some((k) => k.includes(q))
        );
      })
    : COMMANDS;

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      // Focus input on next tick after mount
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) {
            router.push(filtered[selectedIndex]!.href);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, router, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden",
          "animate-in fade-in zoom-in-95 duration-150",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search admin pages..."
            className="flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-white/30"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shrink-0 rounded border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/30">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-white/30">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    router.push(cmd.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                    i === selectedIndex
                      ? "bg-white/[0.06] text-white"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white/80",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{cmd.label}</span>
                    {cmd.description && (
                      <span className="block truncate text-xs text-white/30">
                        {cmd.description}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/25">
                    /{cmd.href.split("/").slice(2).join("/") || "/"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-white/25">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.06] px-1 font-mono text-[10px]">
              ↑↓
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/25">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.06] px-1 font-mono text-[10px]">
              ↵
            </kbd>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/25">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.06] px-1 font-mono text-[10px]">
              Esc
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
