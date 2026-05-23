"use client";

import { useMemo, useState } from "react";
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
  DialogTrigger,
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
import { useRouter } from "next/navigation";

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
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type LoadStatus = "Pending" | "In Transit" | "Delivered" | "Cancelled";

type ServiceType = "Freight" | "Last Mile";

type Mode = "Road" | "Air" | "Rail" | "Sea";

type Load = {
  id: string;
  loadNumber: string;
  shipper: string;
  status: LoadStatus;
  serviceType: ServiceType;
  mode: Mode;
  origin: string;
  destination: string;
};

/* -------------------------------------------------------------------------- */
/*                                   ZOD                                      */
/* -------------------------------------------------------------------------- */

const loadSchema = z.object({
  loadNumber: z.string().min(3, "Load number required"),
  shipper: z.string().min(2, "Shipper required"),
  status: z.enum(["Pending", "In Transit", "Delivered", "Cancelled"]),
  serviceType: z.enum(["Freight", "Last Mile"]),
  mode: z.enum(["Road", "Air", "Rail", "Sea"]),
  origin: z.string().min(2, "Origin required"),
  destination: z.string().min(2, "Destination required"),
});

type LoadFormValues = z.infer<typeof loadSchema>;

/* -------------------------------------------------------------------------- */
/*                                  ZUSTAND                                   */
/* -------------------------------------------------------------------------- */

type LoadStore = {
  loads: Load[];
  addLoad: (load: Load) => void;
  updateLoad: (id: string, load: Load) => void;
};

const useLoadStore = create<LoadStore>((set) => ({
  loads: [
    {
      id: "1",
      loadNumber: "LD-1001",
      shipper: "ABC Logistics",
      status: "In Transit",
      serviceType: "Freight",
      mode: "Road",
      origin: "Karachi",
      destination: "Lahore",
    },
    {
      id: "2",
      loadNumber: "LD-1002",
      shipper: "Swift Cargo",
      status: "Delivered",
      serviceType: "Last Mile",
      mode: "Air",
      origin: "Islamabad",
      destination: "Rawalpindi",
    },
    {
      id: "3",
      loadNumber: "LD-1003",
      shipper: "Pak Movers",
      status: "Pending",
      serviceType: "Freight",
      mode: "Rail",
      origin: "Faisalabad",
      destination: "Multan",
    },
  ],

  addLoad: (load) =>
    set((state) => ({
      loads: [...state.loads, load],
    })),

  updateLoad: (id, updatedLoad) =>
    set((state) => ({
      loads: state.loads.map((load) => (load.id === id ? updatedLoad : load)),
    })),
}));

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function LoadsPage() {
  const { loads } = useLoadStore();

  const [editingLoad, setEditingLoad] = useState<Load | null>(null);

  /* -------------------------------- KPI's -------------------------------- */

  const stats = useMemo(() => {
    return {
      total: loads.length,
      transit: loads.filter((l) => l.status === "In Transit").length,
      delivered: loads.filter((l) => l.status === "Delivered").length,
      exceptions: loads.filter((l) => l.status === "Cancelled").length,
    };
  }, [loads]);

  /* ------------------------------- TABLE -------------------------------- */

  const columns: ColumnDef<Load>[] = [
    {
      accessorKey: "loadNumber",
      header: "Load Number",
    },
    {
      accessorKey: "shipper",
      header: "Shippers",
    },
    {
      accessorKey: "status",
      header: "Load Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="bg-transparent border border-card-border text-foreground hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="border border-card-border bg-background text-foreground hover:bg-muted"
              onClick={() => setEditingLoad(row.original)}
            >
              Edit Load
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const router = useRouter();

  const table = useReactTable({
    data: loads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Operations
            </p>

            <h1 className="mt-2 text-4xl font-bold text-foreground">
              Manage Loads
            </h1>

            <p className="mt-2 text-muted">
              Manage load operations and shipment workflows.
            </p>
          </div>

          <Button
            onClick={() => router.push("/admin/loads/create")}
            className="bg-primary rounded-md text-sidebar hover:bg-primary/80"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Load
          </Button>
        </div>

        {/* KPI CARDS */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total Loads"
            value={stats.total}
            icon={<Truck className="h-5 w-5" />}
          />

          <KpiCard
            title="In Transit"
            value={stats.transit}
            icon={<Clock3 className="h-5 w-5" />}
          />

          <KpiCard
            title="Delivered"
            value={stats.delivered}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <KpiCard
            title="Exceptions"
            value={stats.exceptions}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>

        {/* TABLE */}
        <Card className="border-card-border bg-card shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Loads Management</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-hidden rounded-lg border border-card-border">
              <Table>
                <TableHeader className="bg-primary">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow className="hover:bg-primary" key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-14 text-xs font-bold px-8 uppercase tracking-[0.15em] text-sidebar"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-background">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 px-8">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION */}
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-muted">
                Page {table.getState().pagination.pageIndex + 1}
              </p>

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
                  className="bg-primary text-sidebar hover:bg-primary-light"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EDIT DIALOG */}
      {editingLoad && (
        <EditLoadDialog
          load={editingLoad}
          open={!!editingLoad}
          onClose={() => setEditingLoad(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 KPI CARD                                   */
/* -------------------------------------------------------------------------- */

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
    <Card className="border-card-border bg-card shadow-sm">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted">{title}</p>

          <h2 className="mt-2 text-3xl font-bold text-foreground">{value}</h2>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                               STATUS BADGE                                 */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: LoadStatus }) {
  const styles: Record<LoadStatus, string> = {
    Pending: "bg-warning/10 text-warning border-warning/20",
    "In Transit": "bg-info/10 text-info border-info/20",
    Delivered: "bg-success/10 text-success border-success/20",
    Cancelled: "bg-danger/10 text-danger border-danger/20",
  };

  return (
    <div
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              EDIT LOAD DIALOG                              */
/* -------------------------------------------------------------------------- */

function EditLoadDialog({
  load,
  open,
  onClose,
}: {
  load: Load;
  open: boolean;
  onClose: () => void;
}) {
  const { updateLoad } = useLoadStore();

  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadSchema),
    defaultValues: load,
  });

  function onSubmit(values: LoadFormValues) {
    updateLoad(load.id, {
      ...load,
      ...values,
    });

    toast.success("Load updated successfully");

    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl border border-card-border bg-card shadow-2xl">
        <div className="border-b border-card-border px-6 py-4">
          <DialogTitle className="text-xl font-semibold">Edit Load</DialogTitle>

          <p className="mt-1 text-sm text-muted">
            Update shipment and load details.
          </p>
        </div>

        <div className="p-6">
          <LoadForm form={form} onSubmit={onSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  FORM                                      */
/* -------------------------------------------------------------------------- */

function LoadForm({ form, onSubmit }: any) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <CustomField form={form} name="loadNumber" label="Load Number" />

          <CustomField form={form} name="shipper" label="Shipper" />

          <CustomSelect
            form={form}
            name="status"
            label="Status"
            options={["Pending", "In Transit", "Delivered", "Cancelled"]}
          />

          <CustomSelect
            form={form}
            name="serviceType"
            label="Service Type"
            options={["Freight", "Last Mile"]}
          />

          <CustomSelect
            form={form}
            name="mode"
            label="Mode"
            options={["Road", "Air", "Rail", "Sea"]}
          />

          <CustomField form={form} name="origin" label="Origin" />

          <CustomField form={form} name="destination" label="Destination" />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-primary text-sidebar hover:bg-primary-light"
          >
            Save Load
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CUSTOM FIELD                                 */
/* -------------------------------------------------------------------------- */

function CustomField({ form, name, label }: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>

          <FormControl>
            <Input
              {...field}
              className="h-11 bg-background border-card-border"
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                               CUSTOM SELECT                                */
/* -------------------------------------------------------------------------- */

function CustomSelect({ form, name, label, options }: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>

          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="h-11 bg-background border-card-border">
                <SelectValue placeholder={label} />
              </SelectTrigger>
            </FormControl>

            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
