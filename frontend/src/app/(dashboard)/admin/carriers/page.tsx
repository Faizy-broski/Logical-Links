"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Plus, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/deliveries/kpi-card";
import { DashboardIcons } from "@/components/ui/dashboard-icons";
import { DataTable } from "@/components/deliveries/deliveries-table";
import { CarrierSheet } from "@/components/carriers/carrier-sheet";
import { StatusDot } from "@/components/profile/profile-kit";

import { useCarriers } from "@/hooks/use-carriers";
import { usePermission } from "@/hooks/use-permission";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_NAMES,
  SERVICES_OFFERED,
  formatDay,
  type EquipmentCategory,
} from "@/lib/carrier-options";
import { CARRIER_STATUSES, CARRIER_STATUS_META, type Carrier, type CarrierStatus } from "@/types/api.types";

const FILTER_CLASS =
  "h-9 rounded-lg border border-card-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary";

export default function AdminCarriersPage() {
  const router = useRouter();
  const canView = usePermission("carriers.view");
  const canCreate = usePermission("carriers.create");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CarrierStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | "">("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: res, isLoading } = useCarriers({ enabled: canView });
  const allCarriers = useMemo(() => (res?.data ?? []) as Carrier[], [res]);

  const stats = useMemo(
    () => ({
      total:      allCarriers.length,
      active:     allCarriers.filter((c) => c.status === "active").length,
      onboarding: allCarriers.filter((c) => c.status === "onboarding").length,
    }),
    [allCarriers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const categoryItems = categoryFilter ? (EQUIPMENT_CATEGORIES[categoryFilter] as readonly string[]) : null;
    return allCarriers.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (categoryItems && !c.equipment_types.some((e) => categoryItems.includes(e))) return false;
      if (serviceFilter && !c.services_offered.includes(serviceFilter)) return false;
      if (!q) return true;
      return [
        c.carrier_name, c.contact_name, c.contact_email, c.contact_phone, c.address_city, c.address_province,
        c.equipment_other, ...c.equipment_types, ...c.services_offered,
        ...c.routes.flatMap((r) => [r.province, r.origin_city, r.destination_city]),
      ].some((v) => v?.toLowerCase().includes(q));
    });
  }, [allCarriers, search, statusFilter, categoryFilter, serviceFilter]);

  const hasFilters = !!(search || statusFilter || categoryFilter || serviceFilter);

  function openAdd() {
    setSheetOpen(true);
  }

  // Overview only — contact, documents and the rest live in the carrier profile.
  const columns: ColumnDef<Carrier>[] = useMemo(
    () => [
      {
        id: "carrier",
        header: "Carrier",
        cell: ({ row }) => {
          const c = row.original;
          const place = [c.address_city, c.address_province].filter((v) => v && v !== "N/A").join(", ");
          return (
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{c.carrier_name}</p>
              {place && <p className="text-xs text-muted">{place}</p>}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = CARRIER_STATUS_META[row.original.status];
          return <StatusDot label={meta.label} dotClass={meta.dot} className="text-sm" />;
        },
      },
      {
        id: "routes",
        header: "Routes",
        cell: ({ row }) => {
          const routes = row.original.routes;
          if (routes.length === 0) return <span className="text-sm text-muted-light">—</span>;
          const first = routes[0];
          return (
            <div className="text-sm">
              <p className="inline-flex items-center gap-1.5 text-foreground">
                {first.origin_city || "—"} <ArrowRight className="h-3 w-3 text-muted" /> {first.destination_city || "—"}
              </p>
              {routes.length > 1 && <p className="text-xs text-muted">+{routes.length - 1} more</p>}
            </div>
          );
        },
      },
      {
        id: "equipment",
        header: "Equipment",
        cell: ({ row }) => {
          const types = row.original.equipment_types;
          if (types.length === 0) return <span className="text-sm text-muted-light">—</span>;
          return (
            <p className="max-w-64 text-sm text-foreground">
              {types.slice(0, 2).join(", ")}
              {types.length > 2 && <span className="text-muted"> +{types.length - 2} more</span>}
            </p>
          );
        },
      },
      {
        id: "added",
        header: "Date Added",
        cell: ({ row }) => <span className="text-sm tabular-nums text-muted">{formatDay(row.original.created_at)}</span>,
      },
    ],
    [],
  );

  if (!canView) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">You do not have access to Carriers.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Partners</p>
            <h1 className="mt-2 text-4xl font-bold text-foreground">Carriers</h1>
            <p className="mt-2 text-sm text-muted">
              Independent trucking companies Logical Links works with, or may work with in the future.
            </p>
          </div>
          {canCreate && (
            <Button onClick={openAdd} className="shrink-0 rounded-xl bg-primary text-sidebar hover:bg-primary/85">
              <Plus className="mr-2 h-4 w-4" />
              Add Carrier
            </Button>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          <KpiCard title="Total Carriers" value={stats.total} icon={DashboardIcons.totalCarriers} chartColor="#C89B3C" isLoading={isLoading} subtitle="" />
          <KpiCard title="Active Carriers" value={stats.active} icon={DashboardIcons.activeCarriers} chartColor="#22C55E" isLoading={isLoading} subtitle="" />
          <KpiCard title="Onboarding" value={stats.onboarding} icon={DashboardIcons.onboardingCarriers} chartColor="#F59E0B" isLoading={isLoading} subtitle="" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CarrierStatus | "")} className={FILTER_CLASS}>
            <option value="">All statuses</option>
            {CARRIER_STATUSES.map((s) => (
              <option key={s} value={s}>{CARRIER_STATUS_META[s].label}</option>
            ))}
          </select>
          <select aria-label="Filter by equipment category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as EquipmentCategory | "")} className={FILTER_CLASS}>
            <option value="">All equipment</option>
            {EQUIPMENT_CATEGORY_NAMES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Filter by service" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={FILTER_CLASS}>
            <option value="">All services</option>
            {SERVICES_OFFERED.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setCategoryFilter("");
                setServiceFilter("");
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <DataTable<Carrier>
          title="Carriers"
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, contact, city, route, equipment…"
          pageSize={10}
          onRowClick={(c) => router.push(`/admin/carriers/${c.id}`)}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-4">
              <Truck className="h-8 w-8 text-muted-light" />
              <p className="text-sm text-muted">
                {allCarriers.length === 0 ? "No carriers yet." : "No carriers match your filters."}
              </p>
              {canCreate && allCarriers.length === 0 && (
                <Button variant="outline" size="sm" onClick={openAdd} className="mt-1 rounded-lg border-card-border text-xs">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add First Carrier
                </Button>
              )}
            </div>
          }
        />
      </div>

      <CarrierSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
