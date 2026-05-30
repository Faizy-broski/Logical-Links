"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, ShieldAlert, User } from "lucide-react";

import { DataTable } from "@/components/loads/loads-table";
import { Load } from "@/types/load.types";
import { LoadFormValues } from "@/lib/validations/load";
import { useLoadStore } from "@/store/load.store";
import { shipperName } from "@/lib/utils/shipper-name";
import KpiGrid from "@/components/loads/kpi-grid";
import { getLoadColumns } from "@/components/loads/columns";
import { LoadDialog } from "@/components/loads/dialogs/load-dialog";
import { DeleteConfirmDialog } from "@/components/loads/dialogs/delete-confirmation-dialog";
import { ViewLoadDialog } from "@/components/loads/dialogs/view-load-dialog";

// ─── Role config ──────────────────────────────────────────────────────────────
//
// All logic that differs between admin / shipper lives here.
// The JSX below is completely role-agnostic.

type Role = "admin" | "shipper";

interface RoleConfig {
  badge: {
    icon: React.ReactNode;
    text: string;
    className: string;
  };
  createDescription: string;
  /** Which loads are visible in the table */
  filterLoads: (loads: Load[], currentShipperId: string) => Load[];
  canEdit: (load: Load, currentShipperId: string) => boolean;
  canDelete: (load: Load, currentShipperId: string) => boolean;
  /** isPrivate value for newly created loads */
  newLoadIsPrivate: boolean;
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  admin: {
    badge: {
      icon: <ShieldAlert className="h-4 w-4 shrink-0" />,
      text: "Viewing as Admin — private shipper loads are hidden · delivered loads cannot be deleted",
      className: "border-info/20 bg-info/5 text-blue-700",
    },
    createDescription: "Fill in the details to create a new shipment load.",
    filterLoads: (loads) => loads.filter((l) => !l.isPrivate),
    canEdit: (load) => !load.isPrivate,
    canDelete: (load) => load.status !== "Delivered" && !load.isPrivate,
    newLoadIsPrivate: false,
  },
  shipper: {
    badge: {
      icon: <User className="h-4 w-4 shrink-0" />,
      text: "", // filled dynamically below
      className: "border-warning/20 bg-warning/5 text-yellow-700",
    },
    createDescription: "Create a private load — visible only to you.",
    filterLoads: (loads, id) =>
      loads.filter((l) => l.shipperId === id || l.createdBy === id),
    canEdit: (load, id) =>
      load.shipperId === id || load.createdBy === id,
    canDelete: (load, id) =>
      load.status !== "Delivered" &&
      (load.shipperId === id || load.createdBy === id),
    newLoadIsPrivate: true,
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoadsPage() {
  const { loads, addLoad, updateLoad, deleteLoad, currentRole, currentShipperId } =
    useLoadStore();

  const role: Role = currentRole === "admin" ? "admin" : "shipper";
  const config = ROLE_CONFIG[role];

  const [viewingLoad, setViewingLoad]   = useState<Load | null>(null);
  const [editingLoad, setEditingLoad]   = useState<Load | null>(null);
  const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
  const [createOpen, setCreateOpen]     = useState(false);
  const [search, setSearch]             = useState("");

  // ── Visible rows ────────────────────────────────────────────────────────────
  const visibleLoads = useMemo(
    () => config.filterLoads(loads, currentShipperId),
    [loads, role, currentShipperId],
  );

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total:      visibleLoads.length,
      transit:    visibleLoads.filter((l) => l.status === "In Transit").length,
      delivered:  visibleLoads.filter((l) => l.status === "Delivered").length,
      exceptions: visibleLoads.filter((l) => l.status === "Cancelled").length,
    }),
    [visibleLoads],
  );

  // ── Search filter ───────────────────────────────────────────────────────────
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

  // ── Permissions (bound to current role + shipper) ───────────────────────────
  const canEdit   = (l: Load) => config.canEdit(l, currentShipperId);
  const canDelete = (l: Load) => config.canDelete(l, currentShipperId);

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getLoadColumns({
        isAdmin: role === "admin",
        canEdit,
        canDelete,
        onEdit:   (load) => setEditingLoad(load),
        onDelete: (load) => setDeletingLoad(load),
      }),
    [role, currentShipperId],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleCreate(values: LoadFormValues) {
    addLoad({
      id: String(Date.now()),
      ...values,
      createdBy:  currentShipperId,
      createdAt:  new Date().toISOString(),
      isPrivate:  config.newLoadIsPrivate,
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

  // ── Badge text (shipper version needs the shipper name) ─────────────────────
  const badgeText =
    role === "shipper"
      ? `Viewing as ${shipperName(currentShipperId)} — your private loads are visible only to you`
      : config.badge.text;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
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

          <Button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-sidebar hover:bg-primary/85"
          >
            <Plus className="h-4 w-4" />
            Create Load
          </Button>
        </div>

        {/* Role badge */}
        <div className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm ${config.badge.className}`}>
          {config.badge.icon}
          <span className="font-medium">{badgeText}</span>
        </div>

        {/* KPI cards */}
        <KpiGrid stats={stats} />

        {/* Table */}
        <DataTable<Load>
          title="Loads Management"
          columns={columns}
          data={filtered}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search loads…"
          onRowClick={setViewingLoad}
          pageSize={10}
          emptyState={
            <span className="text-muted">No loads match your search.</span>
          }
        />
      </div>

      {/* Dialogs */}
      {viewingLoad && (
        <ViewLoadDialog
          load={viewingLoad}
          open={!!viewingLoad}
          onClose={() => setViewingLoad(null)}
          canEdit={canEdit(viewingLoad)}
          onEdit={() => handleEditFromView(viewingLoad)}
        />
      )}

      <LoadDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Load"
        description={config.createDescription}
        isAdmin={role === "admin"}
        onSubmit={handleCreate}
      />

      {editingLoad && (
        <LoadDialog
          open={!!editingLoad}
          onClose={() => setEditingLoad(null)}
          title="Edit Load"
          description="Update the shipment and load details below."
          defaultValues={editingLoad}
          isAdmin={role === "admin"}
          onSubmit={handleUpdate}
        />
      )}

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