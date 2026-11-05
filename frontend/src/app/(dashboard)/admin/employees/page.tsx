"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Users,
  CheckCircle2,
  XCircle,
  Phone,
  Plus,
  MoreVertical,
  UserX,
  UserCheck,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { KpiCard } from "@/components/deliveries/kpi-card";
import { DashboardIcons } from "@/components/ui/dashboard-icons";
import { DataTable } from "@/components/deliveries/deliveries-table";

import {
  useAdminEmployees, useUpdateAdminEmployee, useDeleteAdminEmployee,
  useRestoreAdminEmployee, usePurgeAdminEmployee,
} from "@/hooks/use-admin-employees";
import { useAdminRoles } from "@/hooks/use-admin-role-permissions";
import { usePermission } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth.store";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditProfileDialog } from "@/components/admin/edit-profile-dialog";
import { ADMIN_ROLE_LABELS, type AdminEmployee, type AdminRoleDef, type AdminRoleValue } from "@/types/api.types";

function roleLabel(role: string, roles: AdminRoleDef[]): string {
  return roles.find((r) => r.slug === role)?.label ?? ADMIN_ROLE_LABELS[role] ?? role;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        active
          ? "border-success/25 bg-success/10 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {active ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Active
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3" />
          Disabled
        </>
      )}
    </span>
  );
}

function RolePill({ role, roles }: { role: AdminRoleValue | null; roles: AdminRoleDef[] }) {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full border border-warning/25 bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
        Unassigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {roleLabel(role, roles)}
    </span>
  );
}

function ActionsCell({ employee, roles }: { employee: AdminEmployee; roles: AdminRoleDef[] }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const updateMut = useUpdateAdminEmployee(employee.id);
  const deleteMut = useDeleteAdminEmployee();
  const canSuspend = usePermission("employees.suspend");
  const canManageRoles = usePermission("employees.manage_roles");
  const canEdit = usePermission("employees.edit");
  const canDelete = usePermission("employees.delete");
  const canResetPassword = usePermission("employees.reset_password");
  const isSelf = currentUserId === employee.id;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function toggleActive() {
    try {
      await updateMut.mutateAsync({ isActive: !employee.is_active });
      toast.success(
        employee.is_active
          ? `${employee.full_name ?? employee.email} disabled`
          : `${employee.full_name ?? employee.email} re-enabled`,
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function changeRole(role: AdminRoleValue) {
    if (role === employee.admin_role) return;
    try {
      await updateMut.mutateAsync({ adminRole: role });
      toast.success(`${employee.full_name ?? employee.email} is now ${roleLabel(role, roles)}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function saveEdit(values: { fullName?: string; phone?: string; password?: string }) {
    try {
      await updateMut.mutateAsync(values);
      toast.success(values.password ? "Employee updated — password reset" : "Employee updated");
      setEditOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function confirmDelete() {
    try {
      await deleteMut.mutateAsync(employee.id);
      toast.success(`${employee.full_name ?? employee.email} removed`);
      setDeleteOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const showDelete = canDelete && !isSelf;
  const showEdit = canEdit || canResetPassword;
  if (!canSuspend && !canManageRoles && !showEdit && !showDelete) return null;

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 border-card-border bg-transparent hover:border-primary/30 hover:bg-primary/5"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl border border-card-border bg-card shadow-lg"
      >
        {showEdit && (
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            {canEdit ? "Edit" : "Reset password"}
          </DropdownMenuItem>
        )}
        {canManageRoles && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer gap-2 rounded-lg">
              Change Role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="rounded-xl border border-card-border bg-card shadow-lg">
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role.slug}
                  className="cursor-pointer rounded-lg"
                  disabled={role.slug === employee.admin_role || updateMut.isPending}
                  onClick={() => changeRole(role.slug)}
                >
                  {role.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {canSuspend && (
          <DropdownMenuItem
            className={`cursor-pointer gap-2 rounded-lg ${
              employee.is_active
                ? "text-danger focus:text-danger"
                : "text-green-700 focus:text-green-700"
            }`}
            onClick={toggleActive}
            disabled={updateMut.isPending}
          >
            {employee.is_active ? (
              <>
                <UserX className="h-4 w-4" />
                Disable
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Re-enable
              </>
            )}
          </DropdownMenuItem>
        )}
        {showDelete && (
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg text-danger focus:text-danger"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMut.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <EditProfileDialog
      open={editOpen}
      onClose={() => setEditOpen(false)}
      onSave={saveEdit}
      initial={{ fullName: employee.full_name, phone: employee.phone }}
      loading={updateMut.isPending}
      title={canEdit ? "Edit employee" : "Reset password"}
      showPasswordReset={canResetPassword}
    />
    <ConfirmDialog
      open={deleteOpen}
      onClose={() => setDeleteOpen(false)}
      onConfirm={confirmDelete}
      loading={deleteMut.isPending}
      title="Delete employee"
      description={
        <>
          {employee.full_name ?? employee.email} will be removed from the dashboard
          and can no longer sign in. Their history is kept and this can be undone by
          an administrator.
        </>
      }
      confirmLabel="Delete"
    />
    </>
  );
}

/* Actions for a removed employee: bring them back, or free the email for good. */
function DeletedActionsCell({ employee }: { employee: AdminEmployee }) {
  const canDelete = usePermission("employees.delete");
  const restoreMut = useRestoreAdminEmployee(employee.id);
  const purgeMut = usePurgeAdminEmployee(employee.id);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const label = employee.full_name ?? employee.email;

  if (!canDelete) return null;

  async function restore() {
    try {
      await restoreMut.mutateAsync();
      toast.success(`${label} restored`);
    } catch (err) { toast.error((err as Error).message); }
  }
  async function purge() {
    try {
      await purgeMut.mutateAsync();
      toast.success("Employee permanently deleted");
      setPurgeOpen(false);
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant="outline" onClick={restore} disabled={restoreMut.isPending}
        className="h-8 rounded-lg px-3 text-xs">Restore</Button>
      <Button size="sm" variant="outline" onClick={() => setPurgeOpen(true)} disabled={purgeMut.isPending}
        className="h-8 rounded-lg border-red-200 px-3 text-xs text-red-600 hover:bg-red-50">Delete permanently</Button>
      <ConfirmDialog
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={purge}
        loading={purgeMut.isPending}
        title="Delete permanently"
        description={
          <>
            Permanently delete {label}{employee.email ? <> ({employee.email})</> : null}? Their login and personal
            details are erased and the email address can be used again. Deliveries and history they worked on are
            kept without their personal details. This cannot be undone.
          </>
        }
        confirmLabel="Delete permanently"
      />
    </div>
  );
}

export default function AdminEmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "deleted">("active");
  const isDeletedView = view === "deleted";

  const canView = usePermission("employees.view");
  const canCreate = usePermission("employees.create");
  const canSuspend = usePermission("employees.suspend");
  const canManageRoles = usePermission("employees.manage_roles");
  const canEditEmp = usePermission("employees.edit");
  const canDeleteEmp = usePermission("employees.delete");
  const canResetPwEmp = usePermission("employees.reset_password");
  const canShowActions = canSuspend || canManageRoles || canEditEmp || canDeleteEmp || canResetPwEmp;

  const { data: res, isLoading } = useAdminEmployees(
    { limit: 100, ...(isDeletedView && { deleted: "true" as const }) },
    { enabled: canView },
  );
  const allEmployees = (res?.data ?? []) as AdminEmployee[];

  const { data: rolesRes } = useAdminRoles({ enabled: canView });
  const roles = rolesRes?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q),
    );
  }, [allEmployees, search]);

  const stats = useMemo(
    () => ({
      total:    allEmployees.length,
      active:   allEmployees.filter((e) => e.is_active).length,
      disabled: allEmployees.filter((e) => !e.is_active).length,
    }),
    [allEmployees],
  );

  const columns: ColumnDef<AdminEmployee>[] = useMemo(
    () => [
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-3">
              <UserAvatar
                name={e.full_name ?? e.email}
                avatarUrl={e.avatar_url}
                size="md"
                rounded="xl"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {e.full_name ?? (
                    <span className="italic font-normal text-muted">No name</span>
                  )}
                </p>
                <p className="text-xs text-muted">{e.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => <RolePill role={row.original.admin_role} roles={roles} />,
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) =>
          row.original.phone ? (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {row.original.phone}
            </div>
          ) : (
            <span className="text-sm text-muted-light italic">—</span>
          ),
      },
      ...(isDeletedView
        ? []
        : [{
            id: "status",
            header: "Status",
            cell: ({ row }: { row: { original: AdminEmployee } }) => <StatusPill active={row.original.is_active} />,
          } as ColumnDef<AdminEmployee>]),
      {
        id: "joined",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-xs text-muted">{formatDate(row.original.created_at)}</span>
        ),
      },
      ...(isDeletedView
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }: { row: { original: AdminEmployee } }) => <DeletedActionsCell employee={row.original} />,
            } as ColumnDef<AdminEmployee>,
          ]
        : canShowActions
          ? [
              {
                id: "actions",
                header: "",
                cell: ({ row }: { row: { original: AdminEmployee } }) => (
                  <ActionsCell employee={row.original} roles={roles} />
                ),
              } as ColumnDef<AdminEmployee>,
            ]
          : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canShowActions, roles, isDeletedView],
  );

  if (!canView) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">You do not have access to Employees.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Internal Team
            </p>
            <h1 className="mt-2 text-4xl font-bold text-foreground">Employees</h1>
            <p className="mt-2 text-sm text-muted">
              Manage Logical Links staff accounts and their roles.
            </p>
          </div>
          {canCreate && !isDeletedView && (
            <Button
              onClick={() => router.push("/admin/employees/create")}
              className="shrink-0 rounded-xl bg-primary text-sidebar hover:bg-primary/85"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>

        <div className="inline-flex rounded-xl border border-card-border bg-card p-1">
          {(["active", "deleted"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? "bg-primary text-sidebar" : "text-muted hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {isDeletedView ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-3 text-sm text-red-700">
            Deleted employees cannot sign in and their email stays reserved. Restore one to bring them back, or delete
            them permanently to free the email address.
          </div>
        ) : (
          /* KPI cards */
          <div className="grid gap-5 sm:grid-cols-3">
            <KpiCard title="Total Employees" value={stats.total}    icon={DashboardIcons.totalEmployees}         chartColor="#C89B3C" isLoading={isLoading} />
            <KpiCard title="Active"          value={stats.active}   icon={DashboardIcons.employeesActive}  chartColor="#22C55E" isLoading={isLoading} />
            <KpiCard title="Disabled"        value={stats.disabled} icon={DashboardIcons.employeeDisabled}       chartColor="#EF4444" isLoading={isLoading} />
          </div>
        )}

        {/* Table */}
        <DataTable<AdminEmployee>
          title="Employees"
          columns={columns}
          data={filtered}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email or phone…"
          pageSize={10}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-4">
              <Users className="h-8 w-8 text-muted-light" />
              <p className="text-sm text-muted">{isDeletedView ? "No deleted employees." : "No employees yet."}</p>
              {canCreate && !isDeletedView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/employees/create")}
                  className="mt-1 rounded-lg border-card-border text-xs"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add First Employee
                </Button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
