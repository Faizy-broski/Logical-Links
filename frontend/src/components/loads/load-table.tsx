"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Pencil, Trash2, Lock } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMemo } from "react";
import { LoadStatus, Load } from "@/types/load.types";

type Props = {
  data: Load[];
  search: string;
  setSearch: (v: string) => void;

  canEdit: (load: Load) => boolean;
  canDelete: (load: Load) => boolean;

  onView: (load: Load) => void;
  onEdit: (load: Load) => void;
  onDelete: (load: Load) => void;

  shipperName: (id: string) => string;
  formatDate: (date: string) => string;
};

export function LoadsTable({
  data,
  search,
  setSearch,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  shipperName,
  formatDate,
}: Props) {
  /* columns inside table component */
  const columns = useMemo<ColumnDef<Load>[]>(
    () => [
      {
        accessorKey: "loadNumber",
        header: "Load Number",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">
              {row.original.loadNumber}
            </span>
            {row.original.isPrivate && (
              <Lock className="h-3 w-3 text-muted" />
            )}
          </div>
        ),
      },
      {
        header: "Shipper",
        cell: ({ row }) => shipperName(row.original.shipperId),
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "serviceType",
        header: "Service Type",
      },
      {
        accessorKey: "mode",
        header: "Mode",
      },
      {
        accessorKey: "origin",
        header: "Origin",
      },
      {
        accessorKey: "destination",
        header: "Destination",
      },
      {
        header: "Created",
        cell: ({ row }) => (
          <span className="text-xs text-muted">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const load = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(load)}>
                  View
                </DropdownMenuItem>

                {canEdit(load) ? (
                  <DropdownMenuItem onClick={() => onEdit(load)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <Lock className="mr-2 h-4 w-4" />
                    No access
                  </DropdownMenuItem>
                )}

                {canDelete(load) && (
                  <DropdownMenuItem
                    onClick={() => onDelete(load)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canEdit, canDelete, shipperName, formatDate, onView, onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <div className="space-y-4">

      {/* SEARCH */}
      <div className="flex justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Search loads..."
            className="pl-9"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center">
                  No loads found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onView(row.original)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}