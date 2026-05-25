"use client";

import { useMemo, useState, useEffect } from "react";
import { create } from "zustand";
import { z } from "zod";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Plus,
  Truck,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Search,
  MapPin,
  Package,
  Tag,
  Layers,
  Navigation,
  Pencil,
  Trash2,
  Calendar,
  Lock,
  ShieldAlert,
  User,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  TYPES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

type LoadStatus   = "Pending" | "In Transit" | "Delivered" | "Cancelled";
type ServiceType  = "Freight" | "Last Mile";
type Mode         = "Road" | "Air" | "Rail" | "Sea";
type Role         = "admin" | "shipper";

type Load = {
  id: string;
  loadNumber: string;
  shipperId: string;       // references Shipper.id
  status: LoadStatus;
  serviceType: ServiceType;
  mode: Mode;
  origin: string;
  destination: string;
  createdAt: string;       // ISO date string
  isPrivate: boolean;      // shipper-created loads are private
};

type Shipper = {
  id: string;
  name: string;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SEED DATA                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

const SHIPPERS: Shipper[] = [
  { id: "s1", name: "ABC Logistics"   },
  { id: "s2", name: "Swift Cargo"     },
  { id: "s3", name: "Pak Movers"      },
  { id: "s4", name: "QuickShip Co."   },
  { id: "s5", name: "FastFreight Ltd" },
  { id: "s6", name: "AirLink Express" },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  ZOD SCHEMA                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const loadSchema = z.object({
  loadNumber:  z.string().min(3, "Load number required (min 3 chars)"),
  shipperId:   z.string().min(1, "Please select a shipper"),
  status:      z.enum(["Pending", "In Transit", "Delivered", "Cancelled"]),
  serviceType: z.enum(["Freight", "Last Mile"]),
  mode:        z.enum(["Road", "Air", "Rail", "Sea"]),
  origin:      z.string().min(2, "Origin required"),
  destination: z.string().min(2, "Destination required"),
});

type LoadFormValues = z.infer<typeof loadSchema>;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  ZUSTAND STORE                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

type LoadStore = {
  loads: Load[];
  currentRole: Role;
  currentShipperId: string;  // active when role === "shipper"
  setRole: (role: Role, shipperId?: string) => void;
  addLoad:    (load: Load)            => void;
  updateLoad: (id: string, load: Load) => void;
  deleteLoad: (id: string)            => void;
};

const useLoadStore = create<LoadStore>((set) => ({
  currentRole:      "admin",
  currentShipperId: "s1",

  loads: [
    { id: "1", loadNumber: "LD-1001", shipperId: "s1", status: "In Transit", serviceType: "Freight",   mode: "Road", origin: "Karachi",    destination: "Lahore",     createdAt: "2025-04-10T08:00:00Z", isPrivate: false },
    { id: "2", loadNumber: "LD-1002", shipperId: "s2", status: "Delivered",  serviceType: "Last Mile", mode: "Air",  origin: "Islamabad",  destination: "Rawalpindi", createdAt: "2025-04-12T10:30:00Z", isPrivate: false },
    { id: "3", loadNumber: "LD-1003", shipperId: "s3", status: "Pending",    serviceType: "Freight",   mode: "Rail", origin: "Faisalabad", destination: "Multan",     createdAt: "2025-04-15T09:15:00Z", isPrivate: false },
    { id: "4", loadNumber: "LD-1004", shipperId: "s4", status: "Cancelled",  serviceType: "Last Mile", mode: "Road", origin: "Lahore",     destination: "Gujranwala", createdAt: "2025-04-18T14:00:00Z", isPrivate: false },
    { id: "5", loadNumber: "LD-1005", shipperId: "s5", status: "Pending",    serviceType: "Freight",   mode: "Sea",  origin: "Karachi",    destination: "Dubai",      createdAt: "2025-04-20T11:00:00Z", isPrivate: false },
    { id: "6", loadNumber: "LD-1006", shipperId: "s6", status: "In Transit", serviceType: "Last Mile", mode: "Air",  origin: "Peshawar",   destination: "Lahore",     createdAt: "2025-04-22T16:45:00Z", isPrivate: false },
    // Private shipper-created load (only visible to s1)
    { id: "7", loadNumber: "LD-1007", shipperId: "s1", status: "Pending",    serviceType: "Freight",   mode: "Road", origin: "Lahore",     destination: "Sialkot",    createdAt: "2025-05-01T08:00:00Z", isPrivate: true  },
  ],

  setRole: (role, shipperId) =>
    set({ currentRole: role, currentShipperId: shipperId ?? "s1" }),

  addLoad:    (load)        => set((s) => ({ loads: [...s.loads, load] })),
  updateLoad: (id, updated) => set((s) => ({ loads: s.loads.map((l) => (l.id === id ? updated : l)) })),
  deleteLoad: (id)          => set((s) => ({ loads: s.loads.filter((l) => l.id !== id) })),
}));

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function shipperName(id: string) {
  return SHIPPERS.find((s) => s.id === id)?.name ?? id;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PAGE                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function LoadsPage() {
  const { loads, addLoad, updateLoad, deleteLoad, currentRole, currentShipperId, setRole } =
    useLoadStore();

  const isAdmin = currentRole === "admin";

  const [viewingLoad,  setViewingLoad]  = useState<Load | null>(null);
  const [editingLoad,  setEditingLoad]  = useState<Load | null>(null);
  const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [search,       setSearch]       = useState("");

  /* Visible loads based on role */
  const visibleLoads = useMemo(() => {
    if (isAdmin) return loads.filter((l) => !l.isPrivate);
    // Shipper sees own loads (including private) + non-private loads
    return loads.filter((l) => !l.isPrivate || l.shipperId === currentShipperId);
  }, [loads, isAdmin, currentShipperId]);

  /* KPIs */
  const stats = useMemo(() => ({
    total:      visibleLoads.length,
    transit:    visibleLoads.filter((l) => l.status === "In Transit").length,
    delivered:  visibleLoads.filter((l) => l.status === "Delivered").length,
    exceptions: visibleLoads.filter((l) => l.status === "Cancelled").length,
  }), [visibleLoads]);

  /* Filtered */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleLoads;
    return visibleLoads.filter((l) =>
      l.loadNumber.toLowerCase().includes(q)          ||
      shipperName(l.shipperId).toLowerCase().includes(q) ||
      l.origin.toLowerCase().includes(q)              ||
      l.destination.toLowerCase().includes(q)
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
  const columns: ColumnDef<Load>[] = [
    {
      accessorKey: "loadNumber",
      header: "Load Number",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">{row.original.loadNumber}</span>
          {row.original.isPrivate && (
            <span title="Private load">
              <Lock className="h-3 w-3 text-muted" />
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "shipperId",
      header: "Shipper",
      cell: ({ row }) => <span>{shipperName(row.original.shipperId)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    { accessorKey: "serviceType", header: "Service Type" },
    { accessorKey: "mode",        header: "Mode"         },
    { accessorKey: "origin",      header: "Origin"       },
    { accessorKey: "destination", header: "Destination"  },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted text-xs">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const load = row.original;
        const editable  = canEdit(load);
        const deletable = canDelete(load);

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-card-border bg-transparent text-foreground hover:bg-background focus-visible:ring-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border border-card-border bg-card shadow-md">
                {editable ? (
                  <DropdownMenuItem
                    className="cursor-pointer text-foreground hover:bg-background focus:bg-background"
                    onClick={() => setEditingLoad(load)}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit Load
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="cursor-not-allowed text-muted opacity-60">
                    <Lock className="mr-2 h-3.5 w-3.5" />
                    {load.isPrivate ? "Private — no edit" : "Cannot edit"}
                  </DropdownMenuItem>
                )}

                {isAdmin && (
                  <DropdownMenuItem
                    className={`cursor-pointer focus:bg-background ${
                      deletable
                        ? "text-danger hover:bg-danger/5 focus:text-danger"
                        : "cursor-not-allowed text-muted opacity-60"
                    }`}
                    disabled={!deletable}
                    onClick={() => deletable && setDeletingLoad(load)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {load.status === "Delivered"
                      ? "Cannot delete (delivered)"
                      : "Delete Load"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

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
      id:          String(Date.now()),
      ...values,
      createdAt:   new Date().toISOString(),
      isPrivate:   !isAdmin,   // shipper-created loads are always private
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
        <div className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm ${
          isAdmin
            ? "border-info/20 bg-info/5 text-blue-700"
            : "border-warning/20 bg-warning/5 text-yellow-700"
        }`}>
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
        <div className="grid gap-5 sm:grid-cols-4 xl:grid-cols-4">
          <KpiCard title="Total Loads" value={stats.total}      icon={<Truck         className="h-5 w-5" />} />
          <KpiCard title="In Transit"  value={stats.transit}    icon={<Clock3        className="h-5 w-5" />} />
          <KpiCard title="Delivered"   value={stats.delivered}  icon={<CheckCircle2  className="h-5 w-5" />} />
          <KpiCard title="Exceptions"  value={stats.exceptions} icon={<AlertTriangle className="h-5 w-5" />} />
        </div>

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
                onChange={(e) => { setSearch(e.target.value); table.setPageIndex(0); }}
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
                          {flexRender(h.column.columnDef.header, h.getContext())}
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
                          <TableCell key={cell.id} className="px-6 py-3 text-sm text-foreground">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                  variant="outline" size="sm"
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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  VIEW LOAD DIALOG                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function ViewLoadDialog({
  load,
  open,
  onClose,
  canEdit,
  onEdit,
}: {
  load: Load;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const modeIcons: Record<string, React.ReactNode> = {
    Road: <Truck      className="h-4 w-4" />,
    Air:  <Navigation className="h-4 w-4" />,
    Rail: <Layers     className="h-4 w-4" />,
    Sea:  <MapPin     className="h-4 w-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg border border-card-border bg-card p-0 shadow-2xl"
        style={{ borderRadius: "var(--radius-md, 16px)" }}
      >
        {/* Header */}
        <DialogHeader className="border-b border-card-border px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Load Details
              </p>
              <DialogTitle
                className="mt-1 font-bold text-foreground"
                style={{ fontSize: "1.6rem", lineHeight: 1.15, fontFamily: "var(--font-cormorant, serif)" }}
              >
                {load.loadNumber}
              </DialogTitle>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusBadge status={load.status} />
                {load.isPrivate && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-muted-light/30 bg-muted/10 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                    <Lock className="h-2.5 w-2.5" /> Private
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={onEdit}
                className="mt-8 shrink-0 gap-1.5 rounded-[10px] bg-primary px-4 text-xs text-sidebar hover:bg-primary/85"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Route banner */}
        <div className="mx-6 mt-5 flex items-center gap-3 rounded-[10px] border border-card-border bg-background px-5 py-4">
          <div className="flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Origin</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{load.origin}</p>
          </div>
          <div className="flex flex-1 items-center gap-1">
            <div className="h-px flex-1 bg-card-border" />
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {modeIcons[load.mode]}
            </div>
            <div className="h-px flex-1 bg-card-border" />
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Destination</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{load.destination}</p>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-7 pt-4">
          <DetailTile icon={<Package  className="h-4 w-4" />} label="Shipper"       value={shipperName(load.shipperId)} />
          <DetailTile icon={<Tag      className="h-4 w-4" />} label="Service Type"  value={load.serviceType} />
          <DetailTile icon={modeIcons[load.mode]}              label="Mode"          value={load.mode} />
          <DetailTile icon={<Calendar className="h-4 w-4" />} label="Created"       value={formatDate(load.createdAt)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  DELETE CONFIRM DIALOG                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function DeleteConfirmDialog({
  load,
  open,
  onClose,
  onConfirm,
}: {
  load: Load;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md border border-card-border bg-card p-0 shadow-2xl"
        style={{ borderRadius: "var(--radius-md, 16px)" }}
      >
        <DialogHeader className="border-b border-card-border px-7 py-5">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Delete Load
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted">
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 py-6">
          {/* Warning card */}
          <div className="flex gap-3 rounded-[10px] border border-danger/20 bg-danger/5 px-4 py-4">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">
                Delete <span className="font-bold">{load.loadNumber}</span>?
              </p>
              <p className="mt-1 text-sm text-muted">
                Shipper: {shipperName(load.shipperId)} · Status:{" "}
                <StatusBadge status={load.status} />
              </p>
              <p className="mt-2 text-sm text-muted">
                Once deleted this load will be permanently removed from the system.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-[10px] border-card-border text-foreground hover:bg-background"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="rounded-[10px] bg-danger px-6 text-white hover:bg-danger/85"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Yes, Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  DETAIL TILE                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function DetailTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] border border-card-border bg-background px-4 py-3">
      <div className="flex items-center gap-2 text-muted">
        <span className="shrink-0">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  KPI CARD                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function KpiCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card
      className="border border-card-border bg-card shadow-sm"
      style={{ borderRadius: "var(--radius-md, 16px)" }}
    >
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <h2
            className="mt-1 font-bold text-foreground"
            style={{ fontSize: "2.2rem", lineHeight: 1, fontFamily: "var(--font-cormorant, serif)" }}
          >
            {value}
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STATUS BADGE                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: LoadStatus }) {
  const styles: Record<LoadStatus, string> = {
    Pending:      "bg-warning/10  text-yellow-700 border-warning/25",
    "In Transit": "bg-info/10     text-blue-700   border-info/25",
    Delivered:    "bg-success/10  text-green-700  border-success/25",
    Cancelled:    "bg-danger/10   text-red-700    border-danger/25",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  LOAD DIALOG  (shared for create + edit)                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function LoadDialog({
  open,
  onClose,
  title,
  description,
  defaultValues,
  isAdmin,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  defaultValues?: Partial<Load>;
  isAdmin: boolean;
  onSubmit: (values: LoadFormValues) => void;
}) {
  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadSchema),
    defaultValues: {
      loadNumber:  defaultValues?.loadNumber  ?? "",
      shipperId:   defaultValues?.shipperId   ?? "",
      status:      defaultValues?.status      ?? "Pending",
      serviceType: defaultValues?.serviceType ?? "Freight",
      mode:        defaultValues?.mode        ?? "Road",
      origin:      defaultValues?.origin      ?? "",
      destination: defaultValues?.destination ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        loadNumber:  defaultValues?.loadNumber  ?? "",
        shipperId:   defaultValues?.shipperId   ?? "",
        status:      defaultValues?.status      ?? "Pending",
        serviceType: defaultValues?.serviceType ?? "Freight",
        mode:        defaultValues?.mode        ?? "Road",
        origin:      defaultValues?.origin      ?? "",
        destination: defaultValues?.destination ?? "",
      });
    }
  }, [open]);

  function handleSubmit(values: LoadFormValues) {
    onSubmit(values);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl border border-card-border bg-card p-0 shadow-2xl"
        style={{ borderRadius: "var(--radius-md, 16px)" }}
      >
        <DialogHeader className="border-b border-card-border px-7 py-5">
          <DialogTitle className="text-xl font-semibold text-foreground">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted">{description}</DialogDescription>
        </DialogHeader>

        <div className="px-7 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">

                {/* Load Number */}
                <FormField
                  control={form.control}
                  name="loadNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Load Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="LD-XXXX" className="h-11 rounded-[10px] border-card-border bg-background text-sm focus-visible:ring-primary/40" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Shipper — dropdown from SHIPPERS list */}
                <FormField
                  control={form.control}
                  name="shipperId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Shipper</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-[10px] border-card-border bg-background text-sm focus:ring-primary/40">
                            <SelectValue placeholder="Select a shipper" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-card-border bg-card">
                          {SHIPPERS.map((s) => (
                            <SelectItem
                              key={s.id}
                              value={s.id}
                              className="text-sm text-foreground focus:bg-background"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Status — admin only can set freely; shipper locked to Pending on create */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isAdmin && !defaultValues}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-[10px] border-card-border bg-background text-sm focus:ring-primary/40 disabled:opacity-60">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-card-border bg-card">
                          {["Pending", "In Transit", "Delivered", "Cancelled"].map((o) => (
                            <SelectItem key={o} value={o} className="text-sm text-foreground focus:bg-background">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <SelectField form={form} name="serviceType" label="Service Type" options={["Freight", "Last Mile"]} />
                <SelectField form={form} name="mode"        label="Mode"         options={["Road", "Air", "Rail", "Sea"]} />

                {/* Origin */}
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Origin</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City" className="h-11 rounded-[10px] border-card-border bg-background text-sm focus-visible:ring-primary/40" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Destination */}
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Destination</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City" className="h-11 rounded-[10px] border-card-border bg-background text-sm focus-visible:ring-primary/40" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Private notice for shipper */}
              {!isAdmin && (
                <div className="flex items-center gap-2 rounded-[10px] border border-warning/20 bg-warning/5 px-4 py-2.5 text-sm text-yellow-700">
                  <Lock className="h-4 w-4 shrink-0" />
                  This load will be marked as <strong>private</strong> — visible only to you, not the admin.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-[10px] border-card-border text-foreground hover:bg-background"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-[10px] bg-primary px-6 text-sidebar hover:bg-primary/85"
                >
                  Save Load
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SELECT FIELD                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function SelectField({
  form,
  name,
  label,
  options,
}: {
  form: ReturnType<typeof useForm<LoadFormValues>>;
  name: keyof LoadFormValues;
  label: string;
  options: string[];
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-foreground">{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string}>
            <FormControl>
              <SelectTrigger className="h-11 rounded-[10px] border-card-border bg-background text-sm focus:ring-primary/40">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="border-card-border bg-card">
              {options.map((o) => (
                <SelectItem key={o} value={o} className="text-sm text-foreground focus:bg-background">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}