"use client";

/**
 * @component DataTable
 * @description Reusable data table with TanStack Table.
 * Features: sorting, pagination, search filter, row click, row selection, CSV export,
 * loading skeleton, and a list/grid view toggle (grid/card view default on mobile).
 *
 * @example
 * <DataTable
 *   columns={columns}
 *   data={rules}
 *   searchKey="name"
 *   searchPlaceholder="Search rules..."
 *   onRowClick={(row) => router.push(`/rules/${row.id}`)}
 * />
 */

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type Row,
} from "@tanstack/react-table";
import { useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Download,
  Check,
  Square,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { cn } from "./utils";
import { SkeletonTable } from "./skeleton";

/** Accessible focus styles for interactive table rows */
const rowFocusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/50";

type ViewMode = "table" | "grid";

interface DataTableProps<TData> {
  /** Column definitions */
  columns: ColumnDef<TData, unknown>[];
  /** Table data */
  data: TData[];
  /** Key to filter by (enables search) */
  searchKey?: string;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Callback when row is clicked */
  onRowClick?: (row: TData) => void;
  /** Additional classes */
  className?: string;
  /** Enable row selection (checkbox column) */
  enableRowSelection?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (selectedRows: TData[]) => void;
  /** Enable CSV export */
  enableExport?: boolean;
  /** File name for CSV export */
  exportFileName?: string;
  /** Show loading skeleton instead of table */
  isLoading?: boolean;
  /** Number of skeleton rows to show */
  skeletonRows?: number;
  /**
   * View mode: "table" (traditional), "grid" (card layout).
   * Defaults to "grid" on mobile, "table" on desktop.
   * Pass "table" to force table always, or "grid" to force grid always.
   */
  defaultViewMode?: ViewMode;
  /**
   * Hide the view toggle button.
   * Useful when you want to force a specific view without showing the toggle.
   */
  hideViewToggle?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  onRowClick,
  className,
  enableRowSelection,
  onSelectionChange,
  enableExport,
  exportFileName = "export",
  isLoading,
  skeletonRows = 5,
  defaultViewMode,
  hideViewToggle,
}: DataTableProps<TData>) {
  // Determine default view mode based on screen size
  const [viewMode, setViewMode] = useState<ViewMode>(
    defaultViewMode ?? "table",
  );
  // On mount, check if we should default to grid on mobile
  useEffect(() => {
    if (defaultViewMode) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setViewMode("grid");
    }
  }, [defaultViewMode]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Build columns list — optionally prepend selection column
  const allColumns = enableRowSelection
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                table.toggleAllRowsSelected();
              }}
              className="flex items-center justify-center"
              aria-label={table.getIsAllRowsSelected() ? "Deselect all" : "Select all"}
            >
              {table.getIsAllRowsSelected() ? (
                <Check className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Square className="h-3.5 w-3.5 text-white/30" />
              )}
            </button>
          ),
          cell: ({ row }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                row.toggleSelected();
              }}
              className="flex items-center justify-center"
              aria-label={row.getIsSelected() ? "Deselect row" : "Select row"}
            >
              {row.getIsSelected() ? (
                <Check className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Square className="h-3.5 w-3.5 text-white/20 hover:text-white/40" />
              )}
            </button>
          ),
          size: 40,
        } as ColumnDef<TData>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Notify parent of selection changes
  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((r) => r.original);

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [selectedRows, onSelectionChange]);

  // Export to CSV
  const handleExport = useCallback(() => {
    const headerRow = columns
      .map((col: ColumnDef<TData> & { id?: string; header?: string | unknown }) =>
        typeof col.header === "string"
          ? col.header
          : (col.id as string) || "",
      )
      .join(",");

    const dataRows = table.getRowModel().rows
      .map((row) => {
        const cells = row
          .getVisibleCells()
          .filter((cell) => cell.column.id !== "select");
        return cells
          .map((cell) => {
            const val = cell.getValue();
            const str =
              val === null || val === undefined
                ? ""
                : String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",");
      })
      .join("\n");

    const csv = `${headerRow}\n${dataRows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, table, exportFileName]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {searchKey && (
          <div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-white/5" />
        )}
        <SkeletonTable rows={skeletonRows} columns={columns.length} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar: Search + View Toggle + Export */}
      <div className="flex items-center gap-4">
        {searchKey && (
          <div className="flex-1">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full max-w-sm rounded-md border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/20"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {enableRowSelection && selectedRows.length > 0 && (
            <span className="text-xs text-white/40 font-mono">
              {selectedRows.length} selected
            </span>
          )}

          {/* View Toggle */}
          {!hideViewToggle && (
            <button
              onClick={() =>
                setViewMode((v) => (v === "table" ? "grid" : "table"))
              }
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white"
              title={
                viewMode === "table" ? "Switch to card view" : "Switch to table view"
              }
            >
              {viewMode === "table" ? (
                <LayoutGrid className="h-3.5 w-3.5" />
              ) : (
                <Table2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {viewMode === "table" ? "Grid" : "Table"}
              </span>
            </button>
          )}

          {enableExport && data.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white"
              title="Export to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" ? (
      <div className="overflow-hidden rounded-md border border-white/8 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-white/6">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40",
                        header.column.id === "select" && "w-10",
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex cursor-pointer select-none items-center gap-2 hover:text-white/60"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={allColumns.length}
                    className="px-4 py-8 text-center text-sm text-white/30"
                  >
                    No results found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    tabIndex={onRowClick || enableRowSelection ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    className={cn(
                      "border-b border-white/4 transition-colors hover:bg-white/[0.02]",
                      (onRowClick || enableRowSelection) && "cursor-pointer",
                      row.getIsSelected() && "bg-amber-500/[0.03]",
                      rowFocusClasses,
                    )}
                    onClick={() => {
                      onRowClick?.(row.original);
                    }}
                    onKeyDown={(e) => {
                      // Enter/Space: trigger row click or toggle selection
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onRowClick?.(row.original);
                      }
                      if (e.key === " ") {
                        e.preventDefault();
                        if (onRowClick) {
                          onRowClick(row.original);
                        } else if (enableRowSelection) {
                          row.toggleSelected();
                        }
                      }
                      // Arrow key navigation between rows
                      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const rows = (e.currentTarget.parentNode as HTMLElement)?.children;
                        if (rows) {
                          const nextIndex = e.key === "ArrowDown"
                            ? Math.min(rowIndex + 1, rows.length - 1)
                            : Math.max(rowIndex - 1, 0);
                          (rows[nextIndex] as HTMLElement)?.focus();
                        }
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-3 text-sm text-white/70",
                          cell.column.id === "select" && "w-10",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Grid / Card View */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {table.getRowModel().rows.length === 0 ? (
            <div className="col-span-full rounded-md border border-white/8 bg-white/[0.02] p-8 text-center text-sm text-white/30">
              No results found
            </div>
          ) : (
            table.getRowModel().rows.map((row) => (
              <DataCard
                key={row.id}
                row={row}
                onRowClick={onRowClick}
                enableRowSelection={enableRowSelection}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/40">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <PaginationButton
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}

// ─── DataCard ─────────────────────────────────────────────────

interface DataCardProps<TData> {
  row: Row<TData>;
  onRowClick?: (row: TData) => void;
  enableRowSelection?: boolean;
}

/**
 * Card view for a single row of data.
 * Renders visible cells in a stacked card layout.
 */
function DataCard<TData>({
  row,
  onRowClick,
  enableRowSelection,
}: DataCardProps<TData>) {
  const cells = row.getVisibleCells().filter(
    (cell) => cell.column.id !== "select",
  );

  return (
    <div
      tabIndex={onRowClick ? 0 : undefined}
      role={onRowClick ? "button" : undefined}
      className={cn(
        "rounded-md border border-white/8 bg-white/[0.02] p-4 transition-all hover:border-white/[0.14] hover:bg-white/[0.04]",
        onRowClick && "cursor-pointer",
        row.getIsSelected() && "ring-1 ring-amber-500/40 bg-amber-500/[0.03]",
      )}
      onClick={() => onRowClick?.(row.original)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onRowClick?.(row.original);
        }
      }}
    >
      {/* Selection indicator */}
      {enableRowSelection && (
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              row.toggleSelected();
            }}
            className="flex items-center justify-center"
            aria-label={row.getIsSelected() ? "Deselect row" : "Select row"}
          >
            {row.getIsSelected() ? (
              <Check className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Square className="h-3.5 w-3.5 text-white/20 hover:text-white/40" />
            )}
          </button>
          {row.getIsSelected() && (
            <span className="text-[10px] text-amber-400/60 font-mono">
              Selected
            </span>
          )}
        </div>
      )}

      {/* Cells stacked vertically */}
      <div className="space-y-2">
        {cells.map((cell, idx) => {
          const headerText =
            typeof cell.column.columnDef.header === "string"
              ? cell.column.columnDef.header
              : (cell.column.id as string) || "";
          const isFirst = idx === 0;

          return (
            <div key={cell.id}>
              {isFirst ? (
                // First cell = card title
                <div className="font-medium text-white text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 flex-shrink-0">
                    {headerText}
                  </span>
                  <span className="text-xs text-white/70 text-right truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Internal pagination button */
function PaginationButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}
