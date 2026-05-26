"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type TableOptions,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableProps<TData> {
  /** Column definitions built with @tanstack/react-table's ColumnDef */
  columns: ColumnDef<TData, unknown>[];
  /** Rows to render */
  data: TData[];

  // ── Header ──
  /** Card title shown top-left */
  title?: string;
  /** Controlled search value */
  searchValue?: string;
  /** Called on every keystroke in the search box */
  onSearchChange?: (value: string) => void;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;

  // ── Row interaction ──
  /** Called when a row is clicked — receives the row's original data object */
  onRowClick?: (row: TData) => void;

  // ── Pagination ──
  /** Rows per page (default: 5) */
  pageSize?: number;

  // ── Slots ──
  /** Node rendered to the right of the title (e.g. a "Create" button) */
  headerActions?: React.ReactNode;
  /** Replaces the default "No results" message */
  emptyState?: React.ReactNode;

  // ── Style ──
  className?: string;
  /** Extra options forwarded directly to useReactTable */
  tableOptions?: Partial<TableOptions<TData>>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<TData>({
  columns,
  data,
  title = "Table",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  onRowClick,
  pageSize = 5,
  headerActions,
  emptyState,
  className,
  tableOptions,
}: DataTableProps<TData>) {
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    ...tableOptions,
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(1, table.getPageCount());

  return (
    <Card
      className={cn(
        "border border-card-border bg-card shadow-md",
        className,
      )}
      style={{ borderRadius: "var(--radius-md, 16px)" }}
    >
      {/* ── Card header ── */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-card-border px-6 py-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          {title}
        </CardTitle>

        <div className="flex items-center gap-3">
          {/* Search input — only rendered when a handler is wired up */}
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-light" />
              <Input
                value={searchValue ?? ""}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  table.setPageIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="h-9 w-52 rounded-[10px] border-card-border bg-background pl-9 text-sm placeholder:text-muted-light focus-visible:ring-primary/40"
              />
            </div>
          )}

          {/* Slot for buttons / filters passed by the parent */}
          {headerActions}
        </div>
      </CardHeader>

      {/* ── Table ── */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            {/* Header */}
            <TableHeader className="bg-primary">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-0 hover:bg-primary">
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      className="h-12 px-6 text-[11px] font-bold uppercase tracking-[0.15em] text-sidebar"
                    >
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            {/* Body */}
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-12 text-center text-sm text-muted"
                  >
                    {emptyState ?? "No results found."}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "border-card-border transition-colors",
                      onRowClick && "cursor-pointer hover:bg-primary/4",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-6 py-3 text-sm text-foreground"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination footer ── */}
        <div className="flex items-center justify-between border-t border-card-border px-6 py-4">
          <p className="text-sm text-muted">
            Page{" "}
            <span className="font-medium text-foreground">{pageIndex + 1}</span>
            {" "}of{" "}
            <span className="font-medium text-foreground">{pageCount}</span>
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-[10px] border-card-border text-foreground hover:bg-background disabled:opacity-40"
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-[10px] bg-primary text-sidebar hover:bg-primary/85 disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}