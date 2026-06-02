"use client";

/**
 * CommandPalette
 * --------------
 * Shared ⌘K command palette overlay for all Syntaxure apps.
 * Supports keyboard navigation (arrows, enter, escape), search filtering
 * by label/description/keywords, and sections with labelled groups.
 *
 * Each app passes its own items via the `sections` prop, keeping
 * app-specific context (workspaces, user roles, nav pages) in app code.
 *
 * @example
 * <CommandPalette
 *   open={open}
 *   onClose={close}
 *   sections={[
 *     {
 *       id: "pages",
 *       label: "Pages",
 *       items: [
 *         { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => router.push("/") },
 *       ],
 *     },
 *   ]}
 * />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Command } from "lucide-react";
import { cn } from "./utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional search keywords (in addition to label + description) */
  keywords?: string[];
  /** Called when the item is selected */
  action: () => void;
}

export interface CommandPaletteSection {
  id: string;
  label: string;
  /** Optional icon component shown before the section label */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional colour class for section icons (default: "text-[var(--text-secondary)]") */
  iconColor?: string;
  /** Optional search keywords (in addition to label), e.g. ["engine", "agency"] */
  keywords?: string[];
  items: CommandPaletteItem[];
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Sections of items to display */
  sections: CommandPaletteSection[];
  /** Placeholder text (default: "Search...") */
  placeholder?: string;
  /** Maximum height of results list (default: 320) */
  maxHeight?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CommandPalette({
  open,
  onClose,
  sections,
  placeholder = "Search...",
  maxHeight = 320,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape (global, not just when input is focused)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ── Filter sections (including by section label) ──

  const filteredSections = sections
    .map((s) => {
      const q = query.trim().toLowerCase();
      // Section is "search-highlighted" when the query matches its label
      const isSearchHighlighted = !!q && (
        s.label.toLowerCase().includes(q) ||
        (s.keywords || []).some((k) => k.toLowerCase().includes(q))
      );
      return {
        ...s,
        isSearchHighlighted,
        items: s.items.filter((item) => {
          if (!q) return true;
          return (
            item.label.toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (item.keywords || []).some((k) => k.toLowerCase().includes(q)) ||
            isSearchHighlighted
          );
        }),
      };
    })
    .filter((s) => s.items.length > 0);

  const filtered = filteredSections.flatMap((s) => s.items);
  const hasResults = filtered.length > 0;

  // ── Keyboard navigation ──

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) {
            filtered[selectedIndex]!.action();
          }
          break;
      }
    },
    [filtered, selectedIndex],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border-subtle)]",
          "bg-[var(--bg-secondary)]/95 backdrop-blur-xl shadow-2xl shadow-black/50",
          "animate-in fade-in zoom-in-95 duration-150",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* ── Search Input ── */}
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            style={{ outline: "none", boxShadow: "none", border: "none" }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shrink-0 rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            ESC
          </kbd>
        </div>

        {/* ── Results ── */}
        <div
          className="overflow-y-auto py-2"
          style={{ maxHeight }}
          onMouseLeave={() => setSelectedIndex(-1)}
        >
          {!hasResults && (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Command className="h-8 w-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">
                No results for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {hasResults &&
            filteredSections.map((section) => (
              <div key={section.id}>
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 py-2">
                  {(() => {
                    const SectionIcon = section.icon;
                    return SectionIcon ? (
                      <SectionIcon className={cn(
                        "h-3 w-3",
                        section.iconColor || "text-[var(--text-tertiary)]",
                        section.isSearchHighlighted && "animate-pulse",
                      )} />
                    ) : null;
                  })()}
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                    {section.label}
                  </h3>
                </div>

                {/* Section items */}
                {section.items.map((item) => {
                  const flatIndex = filtered.indexOf(item);
                  const isSelected = flatIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-[var(--border-subtle)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            section.iconColor || "text-[var(--text-secondary)]",
                          )}
                        />
                      )}
                      <div className="flex-1 truncate">
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className="ml-2 text-[11px] text-[var(--text-tertiary)]">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <kbd className="shrink-0 rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>

        {/* ── Footer hints ── */}
        <div className="flex items-center gap-3 border-t border-[var(--border-subtle)] px-4 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1 font-mono">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1 font-mono">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1 font-mono">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
