"use client";

import { useMemo, useState } from "react";
import { create } from "zustand";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MoreHorizontal,
  Search,
  Truck,
  Users,
  CheckCircle2,
  Clock3,
  Phone,
  Mail,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/* TYPES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

type ShipperStatus = "Active" | "Pending" | "Suspended";

type Shipper = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: ShipperStatus;
  createdAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* ZUSTAND STORE                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

type ShipperStore = {
  shippers: Shipper[];

  updateShipperStatus: (
    id: string,
    status: ShipperStatus
  ) => void;
};

const useShipperStore = create<ShipperStore>((set) => ({
  shippers: [
    {
      id: "SHP-1001",
      name: "ABC Logistics",
      phone: "+92 300 1234567",
      email: "contact@abclogistics.com",
      status: "Active",
      createdAt: "2025-01-12T08:00:00Z",
    },

    {
      id: "SHP-1002",
      name: "Swift Cargo",
      phone: "+92 301 6543210",
      email: "support@swiftcargo.com",
      status: "Pending",
      createdAt: "2025-02-03T10:30:00Z",
    },

    {
      id: "SHP-1003",
      name: "Pak Movers",
      phone: "+92 302 9988776",
      email: "hello@pakmovers.com",
      status: "Active",
      createdAt: "2025-02-15T09:20:00Z",
    },

    {
      id: "SHP-1004",
      name: "QuickShip Co.",
      phone: "+92 333 1112233",
      email: "info@quickship.com",
      status: "Suspended",
      createdAt: "2025-03-02T11:45:00Z",
    },

    {
      id: "SHP-1005",
      name: "FastFreight Ltd",
      phone: "+92 345 6677889",
      email: "admin@fastfreight.com",
      status: "Active",
      createdAt: "2025-03-28T14:15:00Z",
    },

    {
      id: "SHP-1006",
      name: "AirLink Express",
      phone: "+92 321 5566778",
      email: "team@airlinkexpress.com",
      status: "Pending",
      createdAt: "2025-04-09T16:00:00Z",
    },
  ],

  updateShipperStatus: (id, status) =>
    set((state) => ({
      shippers: state.shippers.map((shipper) =>
        shipper.id === id
          ? { ...shipper, status }
          : shipper
      ),
    })),
}));

/* ─────────────────────────────────────────────────────────────────────────── */
/* HELPERS                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* PAGE                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function ShippersPage() {
  const {
    shippers,
    updateShipperStatus,
  } = useShipperStore();

  const [search, setSearch] = useState("");

  /* FILTERED SHIPPERS */
  const filteredShippers = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return shippers;

    return shippers.filter(
      (shipper) =>
        shipper.id.toLowerCase().includes(q) ||
        shipper.name.toLowerCase().includes(q) ||
        shipper.phone.toLowerCase().includes(q) ||
        shipper.email.toLowerCase().includes(q)
    );
  }, [search, shippers]);

  /* KPI STATS */
  const stats = useMemo(
    () => ({
      total: shippers.length,

      active: shippers.filter(
        (s) => s.status === "Active"
      ).length,

      pending: shippers.filter(
        (s) => s.status === "Pending"
      ).length,

      suspended: shippers.filter(
        (s) => s.status === "Suspended"
      ).length,
    }),
    [shippers]
  );

  /* TABLE COLUMNS */
  const columns: ColumnDef<Shipper>[] = [
    {
      accessorKey: "id",
      header: "Shipper ID",

      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {row.original.id}
        </span>
      ),
    },

    {
      accessorKey: "name",
      header: "Name",

      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">
            {row.original.name}
          </p>
        </div>
      ),
    },

    {
      id: "contact",
      header: "Contact",

      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Phone className="h-3.5 w-3.5 text-muted" />
            {row.original.phone}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted">
            <Mail className="h-3.5 w-3.5" />
            {row.original.email}
          </div>
        </div>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",

      cell: ({ row }) => {
        const shipper = row.original;

        return (
          <Select
            value={shipper.status}
            onValueChange={(value) =>
              updateShipperStatus(
                shipper.id,
                value as ShipperStatus
              )
            }
          >
            <SelectTrigger className="h-9 w-37.5 rounded-[10px] border-card-border bg-background text-xs font-medium focus:ring-primary/40">

              <SelectValue />

            </SelectTrigger>

            <SelectContent className="border-card-border bg-card">

              <SelectItem
                value="Active"
                className="text-green-700 focus:bg-green-50"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Active
                </div>
              </SelectItem>

              <SelectItem
                value="Pending"
                className="text-yellow-700 focus:bg-yellow-50"
              >
                <div className="flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  Pending
                </div>
              </SelectItem>

              <SelectItem
                value="Suspended"
                className="text-red-700 focus:bg-red-50"
              >
                <div className="flex items-center gap-2">
                  <ShieldX className="h-3.5 w-3.5" />
                  Suspended
                </div>
              </SelectItem>

            </SelectContent>
          </Select>
        );
      },
    },

    {
      accessorKey: "createdAt",
      header: "Created Date",

      cell: ({ row }) => (
        <span className="text-sm text-muted">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },

    {
      id: "actions",
      header: "Actions",

      cell: () => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>

              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 border-card-border bg-transparent"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="border border-card-border bg-card"
            >

              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Shipper
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer text-danger focus:text-danger">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Shipper
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  /* TABLE */
  const table = useReactTable({
    data: filteredShippers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-7">

        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Administration
            </p>

            <h1
              className="mt-2 font-bold text-foreground"
              style={{
                fontSize: "2.6rem",
                lineHeight: 1.1,
              }}
            >
              Manage Shippers
            </h1>

            <p className="mt-2 text-sm text-muted">
              Monitor and manage all registered shipping partners.
            </p>
          </div>

        </div>

        {/* KPI CARDS */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <KpiCard
            title="Total Shippers"
            value={stats.total}
            icon={<Users className="h-5 w-5" />}
          />

          <KpiCard
            title="Active"
            value={stats.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <KpiCard
            title="Pending"
            value={stats.pending}
            icon={<Clock3 className="h-5 w-5" />}
          />

          <KpiCard
            title="Suspended"
            value={stats.suspended}
            icon={<Truck className="h-5 w-5" />}
          />

        </div>

        {/* TABLE */}
        <Card
          className="border border-card-border bg-card shadow-md"
          style={{
            borderRadius: "var(--radius-md, 16px)",
          }}
        >

          <CardHeader className="flex flex-row items-center justify-between border-b border-card-border px-6 py-4">

            <CardTitle className="text-lg font-semibold text-foreground">
              Shippers List
            </CardTitle>

            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-light" />

              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  table.setPageIndex(0);
                }}
                placeholder="Search shippers..."
                className="h-9 w-60 rounded-[10px] border-card-border bg-background pl-9 text-sm"
              />

            </div>

          </CardHeader>

          <CardContent className="p-0">

            <div className="overflow-x-auto">

              <Table>

                <TableHeader className="bg-primary">

                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="border-0 hover:bg-primary"
                    >

                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-12 px-6 text-[11px] font-bold uppercase tracking-[0.15em] text-sidebar"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                        No shippers found.
                      </TableCell>

                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-card-border transition-colors hover:bg-primary/5"
                      >

                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-6 py-4 text-sm text-foreground"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}

                      </TableRow>
                    ))
                  )}

                </TableBody>

              </Table>

            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between border-t border-card-border px-6 py-4">

              <p className="text-sm text-muted">
                Page{" "}

                <span className="font-medium text-foreground">
                  {table.getState().pagination.pageIndex + 1}
                </span>

                {" "}of{" "}

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
                  className="rounded-[10px]"
                >
                  Previous
                </Button>

                <Button
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded-[10px] bg-primary text-sidebar hover:bg-primary/85"
                >
                  Next
                </Button>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* KPI CARD                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card
      className="border border-card-border bg-card shadow-sm"
      style={{
        borderRadius: "var(--radius-md, 16px)",
      }}
    >
      <CardContent className="flex items-center justify-between p-6">

        <div>
          <p className="text-sm text-muted">
            {title}
          </p>

          <h2
            className="mt-1 font-bold text-foreground"
            style={{
              fontSize: "2.2rem",
              lineHeight: 1,
              fontFamily:
                "var(--font-cormorant, serif)",
            }}
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