"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { UserCircle2, Mail, Phone, Calendar, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/deliveries/kpi-card";
import { DashboardIcons } from "@/components/ui/dashboard-icons";
import { DataTable } from "@/components/deliveries/deliveries-table";
import { useTableFilters } from "@/hooks/use-table-filters";
import { AddResidentialCustomerSheet } from "@/components/accounts/add-residential-customer-sheet";
import { CreateDeliverySheet } from "@/components/deliveries/sheets/create-delivery-sheet";

import { useUsers, useRestoreUser, usePurgeUser } from "@/hooks/use-users";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { UserAvatar } from "@/components/ui/user-avatar";
import { InvitationStatusBadge } from "@/components/accounts/invitation-status-badge";
import type { UserProfile } from "@/types/api.types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const FILTER_DEFAULTS = {
  view:   "active",   // "active" | "deleted"
  search: "",
  page:   "1",
};

/* Actions for a removed customer: bring them back, or free the email for good. */
function DeletedActionsCell({ user }: { user: UserProfile }) {
  const canEdit = usePermission("customers.edit");
  const canDelete = usePermission("customers.delete");
  const restoreMut = useRestoreUser(user.id);
  const purgeMut = usePurgeUser(user.id);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const label = user.fullName ?? "this customer";

  async function restore() {
    try {
      await restoreMut.mutateAsync();
      toast.success(`${label} restored`);
    } catch (err) { toast.error((err as Error).message); }
  }
  async function purge() {
    try {
      await purgeMut.mutateAsync();
      toast.success("Customer permanently deleted");
      setPurgeOpen(false);
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {canEdit && (
        <Button size="sm" variant="outline" onClick={restore} disabled={restoreMut.isPending}
          className="h-8 rounded-lg px-3 text-xs">Restore</Button>
      )}
      {canDelete && (
        <Button size="sm" variant="outline" onClick={() => setPurgeOpen(true)} disabled={purgeMut.isPending}
          className="h-8 rounded-lg border-red-200 px-3 text-xs text-red-600 hover:bg-red-50">Delete permanently</Button>
      )}
      <ConfirmDialog
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={purge}
        loading={purgeMut.isPending}
        title="Delete permanently"
        description={
          <>
            Permanently delete {label}
            {user.email ? <> ({user.email})</> : null}? Their personal details are erased and the email
            address can be registered again. Past deliveries and invoices are kept without personal details.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete permanently"
      />
    </div>
  );
}

export default function ResidentialCustomersPage() {
  const router = useRouter();
  const canCreate = usePermission("deliveries.create");
  const canView = usePermission("customers.view");
  const canAddCustomer = usePermission("customers.create");
  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { filters, setFilter } = useTableFilters(FILTER_DEFAULTS);
  const page = parseInt(filters.page || "1", 10);
  const isDeletedView = filters.view === "deleted";

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [filters.search]);

  const query = useMemo(() => ({
    page,
    limit: 20,
    role: "residential",
    ...(isDeletedView && { deleted: "true" as const }),
    ...(debouncedSearch && { search: debouncedSearch }),
  }), [page, debouncedSearch, isDeletedView]);

  const { data: res, isLoading } = useUsers(query, { enabled: canView });
  const customers   = res?.data ?? [];
  const totalCount  = (res as any)?.meta?.total ?? 0;

  const columns: ColumnDef<UserProfile>[] = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <UserAvatar name={u.fullName} avatarUrl={u.avatarUrl} size="md" rounded="xl" />
              <div>
                <p className="text-sm font-semibold text-foreground">{u.fullName ?? "No name"}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Mail className="h-3 w-3 shrink-0" />{u.email || "No email — books by phone"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "invitation",
        header: "Account",
        cell: ({ row }) =>
          row.original.invitation && row.original.invitation.status !== "activated"
            ? <InvitationStatusBadge status={row.original.invitation.status} />
            : <span className="text-xs text-muted">{row.original.invitation ? "Active login" : "—"}</span>,
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) =>
          row.original.phone ? (
            <span className="flex items-center gap-1 text-sm text-foreground">
              <Phone className="h-3.5 w-3.5 text-muted" />{row.original.phone}
            </span>
          ) : (
            <span className="text-xs italic text-muted-light">Not provided</span>
          ),
      },
      {
        id: "registered",
        header: "Registered",
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Calendar className="h-3 w-3 shrink-0" />{formatDate(row.original.createdAt)}
          </span>
        ),
      },
      ...(isDeletedView
        ? [{
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: UserProfile } }) => <DeletedActionsCell user={row.original} />,
          } as ColumnDef<UserProfile>]
        : []),
    ],
    [isDeletedView],
  );

  if (!canView) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">You do not have access to Residential Customers.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Administration</p>
          <h1 className="mt-2 text-4xl font-bold text-foreground">Residential Customers</h1>
          <p className="mt-2 text-sm text-muted">Individuals whose deliveries are managed directly, outside any shipping company.</p>
        </div>

        <div className="inline-flex rounded-xl border border-card-border bg-card p-1">
          {(["active", "deleted"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setFilter("view", v); setFilter("page", "1"); }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                (isDeletedView ? "deleted" : "active") === v ? "bg-primary text-sidebar" : "text-muted hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {isDeletedView ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-3 text-sm text-red-700">
            Deleted customers cannot sign in and their email stays reserved. Restore one to bring it back, or delete it
            permanently to free the email address.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-1 max-w-xs">
            <KpiCard title="Total Customers" value={totalCount} icon={DashboardIcons.totalCustomers} chartColor="#C89B3C" isLoading={isLoading} />
          </div>
        )}

        <DataTable<UserProfile>
          title="Residential Customers"
          columns={columns}
          data={customers}
          isLoading={isLoading}
          searchValue={filters.search}
          onSearchChange={(v) => setFilter("search", v)}
          onRowClick={(u) => router.push(`/admin/residential/${u.id}`)}
          searchPlaceholder="Search by name or email…"
          pageSize={20}
          totalCount={totalCount}
          page={page}
          onPageChange={(pg) => setFilter("page", String(pg))}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-4">
              <UserCircle2 className="h-8 w-8 text-muted-light" />
              <p className="text-sm text-muted">No residential customers found.</p>
            </div>
          }
          headerActions={
            <div className="flex items-center gap-2">
              {!isDeletedView && canAddCustomer && (
                <Button variant="outline" onClick={() => setAddOpen(true)} className="rounded-lg">
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              )}
              {!isDeletedView && canCreate && (
                <Button onClick={() => setCreateOpen(true)} className="rounded-lg bg-primary text-sidebar hover:bg-primary/85">
                  <Plus className="h-4 w-4" />
                  Create a Delivery
                </Button>
              )}
            </div>
          }
        />
      </div>

      <AddResidentialCustomerSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <CreateDeliverySheet open={createOpen} onClose={() => setCreateOpen(false)} context="residential" />
    </div>
  );
}
