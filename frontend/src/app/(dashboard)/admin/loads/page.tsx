"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  Plus,
  Search,
  ShieldAlert,
  User,
} from "lucide-react";
import { Load } from "@/types/load.types";
import { LoadFormValues } from "@/lib/validations/load";
import { useLoadStore } from "@/store/load.store";
import { shipperName } from "@/lib/utils/shipper-name";
import KpiGrid from "@/components/loads/kpi-grid";
import { getLoadColumns } from "@/components/loads/columns";
import { LoadDialog } from "@/components/loads/dialogs/load-dialog";
import { DeleteConfirmDialog } from "@/components/loads/dialogs/delete-confirmation-dialog";
import { ViewLoadDialog } from "@/components/loads/dialogs/view-load-dialog";

export default function LoadsPage() {
  const {
    loads,
    addLoad,
    updateLoad,
    deleteLoad,
    currentRole,
    currentShipperId,
  } = useLoadStore();

  const isAdmin = currentRole === "admin";

  const [viewingLoad, setViewingLoad] = useState<Load | null>(null);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  /* Visible loads based on role */
  const visibleLoads = useMemo(() => {
    if (isAdmin) return loads.filter((l) => !l.isPrivate);
    // Shipper sees own loads (including private) + non-private loads
    return loads.filter(
      (l) => !l.isPrivate || l.shipperId === currentShipperId,
    );
  }, [loads, isAdmin, currentShipperId]);

  /* KPIs */
  const stats = useMemo(
    () => ({
      total: visibleLoads.length,
      transit: visibleLoads.filter((l) => l.status === "In Transit").length,
      delivered: visibleLoads.filter((l) => l.status === "Delivered").length,
      exceptions: visibleLoads.filter((l) => l.status === "Cancelled").length,
    }),
    [visibleLoads],
  );

  /* Filtered */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleLoads;
    return visibleLoads.filter(
      (l) =>
        l.loadNumber.toLowerCase().includes(q) ||
        shipperName(l.shipperId).toLowerCase().includes(q) ||
        l.origin.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q),
    );
  }, [visibleLoads, search]);

  /* Permission helpers */
  function canEdit(load: Load) {
    if (!isAdmin) return load.shipperId === currentShipperId;
    return !load.isPrivate; // admin cannot edit shipper-private loads
  }

  function canDelete(load: Load) {
    if (!isAdmin) return false;
    return load.status !== "Delivered" && !load.isPrivate;
  }

  /* Columns */
  const columns = useMemo(
    () =>
      getLoadColumns({
        isAdmin,

        canEdit,
        canDelete,

        onEdit: (load) => setEditingLoad(load),
        onDelete: (load) => setDeletingLoad(load),
      }),
    [isAdmin, currentShipperId],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  /* Handlers */
  function handleCreate(values: LoadFormValues) {
    addLoad({
      id: String(Date.now()),
      ...values,
      createdAt: new Date().toISOString(),
      isPrivate: !isAdmin, // shipper-created loads are always private
    });
    toast.success("Load created successfully");
    setCreateOpen(false);
  }

  function handleUpdate(values: LoadFormValues) {
    if (!editingLoad) return;
    updateLoad(editingLoad.id, { ...editingLoad, ...values });
    toast.success("Load updated successfully");
    setEditingLoad(null);
  }

  function handleDelete() {
    if (!deletingLoad) return;
    deleteLoad(deletingLoad.id);
    toast.success(`Load ${deletingLoad.loadNumber} deleted`);
    setDeletingLoad(null);
  }

  function handleEditFromView(load: Load) {
    setViewingLoad(null);
    setTimeout(() => setEditingLoad(load), 150);
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* ── HEADER ── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Operations
            </p>
            <h1
              className="mt-2 font-bold text-foreground"
              style={{ fontSize: "2.6rem", lineHeight: 1.1 }}
            >
              Manage Loads
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage load operations and shipment workflows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-sidebar hover:bg-primary/85"
            >
              <Plus className="h-4 w-4" />
              Create Load
            </Button>
          </div>
        </div>

        {/* Role indicator */}
        <div
          className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm ${
            isAdmin
              ? "border-info/20 bg-info/5 text-blue-700"
              : "border-warning/20 bg-warning/5 text-yellow-700"
          }`}
        >
          {isAdmin ? (
            <ShieldAlert className="h-4 w-4 shrink-0" />
          ) : (
            <User className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">
            {isAdmin
              ? "Viewing as Admin — private shipper loads are hidden · delivered loads cannot be deleted"
              : `Viewing as ${shipperName(currentShipperId)} — your private loads are visible only to you`}
          </span>
        </div>

        {/* ── KPI CARDS ── */}
        <KpiGrid stats={stats} />

        {/* ── TABLE CARD ── */}
        <Card
          className="border border-card-border bg-card shadow-md"
          style={{ borderRadius: "var(--radius-md, 16px)" }}
        >
          <CardHeader className="flex flex-row items-center justify-between border-b border-card-border px-6 py-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              Loads Management
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-light" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  table.setPageIndex(0);
                }}
                placeholder="Search loads…"
                className="h-9 w-52 rounded-[10px] border-card-border bg-background pl-9 text-sm placeholder:text-muted-light focus-visible:ring-primary/40"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary">
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="hover:bg-primary border-0">
                      {hg.headers.map((h) => (
                        <TableHead
                          key={h.id}
                          className="h-12 px-6 text-[11px] font-bold uppercase tracking-[0.15em] text-sidebar"
                        >
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="py-12 text-center text-sm text-muted"
                      >
                        No loads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => setViewingLoad(row.original)}
                        className="cursor-pointer border-card-border transition-colors hover:bg-primary/4"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-6 py-3 text-sm text-foreground"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-card-border px-6 py-4">
              <p className="text-sm text-muted">
                Page{" "}
                <span className="font-medium text-foreground">
                  {table.getState().pagination.pageIndex + 1}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {Math.max(1, table.getPageCount())}
                </span>
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
      </div>

      {/* ── VIEW MODAL ── */}
      {viewingLoad && (
        <ViewLoadDialog
          load={viewingLoad}
          open={!!viewingLoad}
          onClose={() => setViewingLoad(null)}
          canEdit={canEdit(viewingLoad)}
          onEdit={() => handleEditFromView(viewingLoad)}
        />
      )}

      {/* ── CREATE DIALOG ── */}
      <LoadDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Load"
        description={
          isAdmin
            ? "Fill in the details to create a new shipment load."
            : "Create a private load — visible only to you."
        }
        isAdmin={isAdmin}
        onSubmit={handleCreate}
      />

      {/* ── EDIT DIALOG ── */}
      {editingLoad && (
        <LoadDialog
          open={!!editingLoad}
          onClose={() => setEditingLoad(null)}
          title="Edit Load"
          description="Update the shipment and load details below."
          defaultValues={editingLoad}
          isAdmin={isAdmin}
          onSubmit={handleUpdate}
        />
      )}

      {/* ── DELETE CONFIRM ── */}
      {deletingLoad && (
        <DeleteConfirmDialog
          load={deletingLoad}
          open={!!deletingLoad}
          onClose={() => setDeletingLoad(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
