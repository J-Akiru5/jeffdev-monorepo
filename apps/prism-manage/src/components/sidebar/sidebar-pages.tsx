"use client";

/**
 * Sidebar Pages Tree
 * ------------------
 * Displays a hierarchical tree of Notion-like pages in the sidebar.
 * Supports inline creation, renaming, and navigation.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import type { Page } from "@/app/actions/pages";
import { createPage, deletePage } from "@/app/actions/pages";

interface SidebarPagesProps {
  workspaceId: string;
  pages: Page[];
  onPagesChange: (pages: Page[]) => void;
  collapsed: boolean;
}

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  depth: number;
  onPagesChange: (pages: Page[]) => void;
  workspaceId: string;
  collapsed: boolean;
}

function PageTreeItem({
  page,
  pages,
  depth,
  onPagesChange,
  workspaceId,
  collapsed,
}: PageTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const children = pages.filter((p) => p.parent_id === page.id);
  const hasChildren = children.length > 0;

  const handleCreateChild = async () => {
    const result = await createPage({
      workspace_id: workspaceId,
      parent_id: page.id,
      title: "Untitled",
    });
    if (result.success && result.page) {
      onPagesChange([...pages, result.page]);
      setExpanded(true);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this page and all sub-pages?")) return;
    const result = await deletePage(page.id);
    if (result.success) {
      // Remove page and all descendants
      const idsToRemove = new Set<string>();
      const collectIds = (id: string) => {
        idsToRemove.add(id);
        pages.filter((p) => p.parent_id === id).forEach((p) => collectIds(p.id));
      };
      collectIds(page.id);
      onPagesChange(pages.filter((p) => !idsToRemove.has(p.id)));
    }
    setShowMenu(false);
  };

  if (collapsed) {
    return (
      <li>
        <Link
          href={`/pages/${page.id}`}
          className="flex h-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/80"
          title={page.title}
        >
          <span className="text-sm">{page.icon}</span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div className="group relative flex items-center">
        {/* Expand/collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60 ${
            !hasChildren ? "invisible" : ""
          }`}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {/* Page link */}
        <Link
          href={`/pages/${page.id}`}
          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="text-sm">{page.icon}</span>
          <span className="truncate">{page.title}</span>
        </Link>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="invisible absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60 group-hover:visible"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-20 w-40 rounded-md border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl">
                <button
                  onClick={handleCreateChild}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:bg-white/[0.04] hover:text-white/80"
                >
                  <Plus className="h-3 w-3" />
                  Add sub-page
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-white/[0.04]"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <ul>
          {children
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((child) => (
              <PageTreeItem
                key={child.id}
                page={child}
                pages={pages}
                depth={depth + 1}
                onPagesChange={onPagesChange}
                workspaceId={workspaceId}
                collapsed={collapsed}
              />
            ))}
        </ul>
      )}
    </li>
  );
}

export function SidebarPages({
  workspaceId,
  pages,
  onPagesChange,
  collapsed,
}: SidebarPagesProps) {
  const [creating, setCreating] = useState(false);

  const rootPages = pages
    .filter((p) => !p.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleCreatePage = async () => {
    setCreating(true);
    const result = await createPage({
      workspace_id: workspaceId,
      title: "Untitled",
    });
    if (result.success && result.page) {
      onPagesChange([...pages, result.page]);
    }
    setCreating(false);
  };

  return (
    <ul className="space-y-0.5">
      {rootPages.map((page) => (
        <PageTreeItem
          key={page.id}
          page={page}
          pages={pages}
          depth={0}
          onPagesChange={onPagesChange}
          workspaceId={workspaceId}
          collapsed={collapsed}
        />
      ))}

      {/* Create new page button */}
      {!collapsed && (
        <li>
          <button
            onClick={handleCreatePage}
            disabled={creating}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
          >
            <Plus className="h-3 w-3" />
            <span>{creating ? "Creating..." : "New page"}</span>
          </button>
        </li>
      )}
    </ul>
  );
}
