"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Pencil, PauseCircle, PowerOff, RotateCcw, Trash2, Users, XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TierDetailsSheet } from "@/components/deliveries/sheets/tier-details-sheet";
import { getTierProgress } from "@/lib/tiers";
import {
  useAccount, useAccountStats, useAccountActivity,
  useUpdateAccount, useDeleteAccount, useSetAccountPipelineStatus,
  useReconsiderAccount, usePurgeAccount,
} from "@/hooks/use-accounts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApproveUser } from "@/hooks/use-users";
import { useAdminEmployees } from "@/hooks/use-admin-employees";
import { useTiers } from "@/hooks/use-tiers";
import { usePermission } from "@/hooks/use-permission";
import { CorporateNotesSection } from "@/components/admin/CorporateNotesSection";
import { ActivityFeed } from "@/components/accounts/activity-feed";
import { PipelineStatusSelect } from "@/components/accounts/pipeline-status-select";
import { RejectAccountDialog } from "@/components/accounts/reject-account-dialog";
import { EditCorporateCustomerSheet } from "@/components/accounts/edit-corporate-customer-sheet";
import { CompanyLogo } from "@/components/ui/company-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  ActionButton, Fields, MoreActions, Monogram, Panel, ProfileHeader, Section, SectionAction,
  StatStrip, StatusDot, type MoreAction,
} from "@/components/profile/profile-kit";
import { ShipmentsSection, SupportTicketsSection } from "@/components/profile/customer-records";
import {
  CORPORATE_PIPELINE_STATUS_META,
  CORPORATE_PORTAL_ACCESS_STATUSES,
  accountDisplayStatus,
  type Account, type AccountProfile, type CorporatePipelineStatus,
} from "@/types/api.types";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(d: string | null, long = false) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", {
    year: "numeric", month: long ? "long" : "short", day: "numeric",
  });
}

function money(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function getAdmin(profiles?: AccountProfile[]): AccountProfile | undefined {
  return profiles?.find((p) => p.company_role === "company_admin");
}

function formatAddress(a: Account): string | null {
  const parts = [a.address_line1, a.address_city, a.address_state, a.address_postcode, a.address_country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AdminCorporateCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: res, isLoading } = useAccount(id);
  const account = res?.data;
  const canEdit = usePermission("customers.edit");
  const canDelete = usePermission("customers.delete");

  const admin = getAdmin(account?.profiles);
  const status = (account?.pipeline_status ?? "prospect") as CorporatePipelineStatus;
  const isRejected = !!account?.rejected_at;
  const isActive = status === "active" && !isRejected;
  const hasPortalAccess = CORPORATE_PORTAL_ACCESS_STATUSES.includes(status) && !isRejected;
  const displayStatus = account ? accountDisplayStatus(account) : status;

  const { data: statsRes } = useAccountStats(isActive ? id : "");
  const { data: activityRes, isLoading: activityLoading } = useAccountActivity(id);
  const { data: tiersRes } = useTiers();

  const activity = activityRes?.data ?? [];
  const stats = statsRes?.data;
  const tiers = tiersRes?.data ?? [];

  const lastStatusChange = useMemo(
    () => activity.find((a) => a.event_type === "status_changed" || a.event_type === "admin_added") ?? null,
    [activity],
  );

  const [tierSheetOpen, setTierSheetOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const statusMut = useSetAccountPipelineStatus(id);
  const deleteMut = useDeleteAccount();
  const reconsiderMut = useReconsiderAccount(id);
  const purgeMut = usePurgeAccount(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Building2 className="h-6 w-6 text-muted" />
        <p className="text-sm font-medium text-foreground">Corporate customer not found</p>
        <Link href="/admin/corporate-customers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Corporate Customers
        </Link>
      </div>
    );
  }

  const handleSetStatus = async (next: CorporatePipelineStatus) => {
    if (next === status) return;
    try {
      await statusMut.mutateAsync(next);
      toast.success(`Stage: ${CORPORATE_PIPELINE_STATUS_META[next].label}`);
    } catch (err) { toast.error((err as Error).message); }
  };

  const handleSuspend = async () => {
    try {
      await statusMut.mutateAsync("inactive");
      toast.success(`${account.account_name} suspended`);
      setSuspendOpen(false);
    } catch (err) { toast.error((err as Error).message); }
  };

  const handleDeactivate = async () => {
    try {
      await statusMut.mutateAsync("lost");
      toast.success(`${account.account_name} deactivated`);
      setDeactivateOpen(false);
    } catch (err) { toast.error((err as Error).message); }
  };

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Corporate customer removed");
      window.location.href = "/admin/corporate-customers";
    } catch (err) { toast.error((err as Error).message); }
  };

  const handleReconsider = async () => {
    try {
      await reconsiderMut.mutateAsync();
      toast.success("Application reopened for review");
    } catch (err) { toast.error((err as Error).message); }
  };

  const handlePurge = async () => {
    try {
      await purgeMut.mutateAsync();
      toast.success("Account permanently deleted");
      window.location.href = "/admin/corporate-customers";
    } catch (err) { toast.error((err as Error).message); }
  };

  const displayId = isActive ? account.customer_id : account.request_id;
  const tierProgress = tiers.length > 0 ? getTierProgress(stats?.deliveredShipments ?? 0, tiers) : null;
  // Admin-added companies have no login, so fall back to the company record.
  const contactName = account.contact_name || admin?.full_name || null;
  const contactPhone = account.contact_phone || admin?.phone || null;
  const statusMeta = CORPORATE_PIPELINE_STATUS_META[displayStatus];

  // Destructive / secondary actions go in the "More" menu, not a stack of buttons.
  const moreActions: MoreAction[] = isRejected
    ? [...(canDelete ? [{ label: "Purge now", icon: Trash2, onClick: () => setPurgeOpen(true), danger: true }] : [])]
    : [
        ...(canEdit ? [{ label: "Manage portal access", icon: Users, onClick: () => setAccessOpen(true) }] : []),
        ...(canEdit && !hasPortalAccess ? [{ label: "Reject application", icon: XCircle, onClick: () => setRejectOpen(true), danger: true }] : []),
        ...(canEdit && hasPortalAccess ? [{ label: "Suspend", icon: PauseCircle, onClick: () => setSuspendOpen(true), danger: true }] : []),
        ...(canEdit && status !== "lost" ? [{ label: "Deactivate account", icon: PowerOff, onClick: () => setDeactivateOpen(true), danger: true }] : []),
        ...(canDelete ? [{ label: "Delete", icon: Trash2, onClick: () => setDeleteOpen(true), danger: true }] : []),
      ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <ProfileHeader
        backHref="/admin/corporate-customers"
        backLabel="Corporate customers"
        media={account.logo_url
          ? <CompanyLogo name={account.account_name} logoUrl={account.logo_url} size="lg" rounded="lg" />
          : <Monogram name={account.account_name} />}
        title={account.account_name}
        meta={[
          <StatusDot key="s" label={statusMeta.label} dotClass={statusMeta.dot} />,
          displayId,
          account.industry,
          `Added ${fmtDate(account.created_at)}`,
        ]}
        actions={
          <>
            {isRejected ? (
              canEdit && (
                <ActionButton icon={RotateCcw} variant="primary" onClick={handleReconsider} disabled={reconsiderMut.isPending}>
                  Reconsider
                </ActionButton>
              )
            ) : (
              canEdit && <PipelineStatusSelect value={status} onChange={handleSetStatus} loading={statusMut.isPending} />
            )}
            {canEdit && (
              <ActionButton icon={Pencil} variant={isRejected ? "secondary" : "primary"} onClick={() => setEditOpen(true)}>
                Edit profile
              </ActionButton>
            )}
            <MoreActions actions={moreActions} />
          </>
        }
      />

      {isRejected && (
        <div className="border-l-2 border-red-500 bg-red-50/60 px-4 py-3 text-sm dark:bg-red-950/20">
          <p className="font-medium text-red-700">Application rejected {fmtDate(account.rejected_at, true)}</p>
          <p className="mt-0.5 text-red-700/80">
            Portal access is revoked. Data is kept until {fmtDate(account.purge_after, true)}, then permanently deleted.
            Use Reconsider before then to restore it.
          </p>
          {account.rejection_reason && <p className="mt-1.5 text-foreground"><span className="text-muted">Reason:</span> {account.rejection_reason}</p>}
          {account.review_note && <p className="mt-0.5 text-foreground"><span className="text-muted">Internal note:</span> {account.review_note}</p>}
        </div>
      )}

      {isActive && (
        <StatStrip
          loading={!stats}
          stats={[
            { label: "Total shipments", value: stats?.totalShipments ?? 0 },
            { label: "Active shipments", value: stats?.activeShipments ?? 0 },
            { label: "Open quotes", value: stats?.openQuotes ?? 0 },
            { label: "Total spend", value: stats ? money(stats.totalSpend) : "—" },
          ]}
        />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <Panel>
          <Section
            title="Primary contact"
            action={canEdit && <SectionAction icon={Pencil} onClick={() => setEditOpen(true)}>Edit</SectionAction>}
          >
            <Fields items={[
              { label: "Contact name", value: contactName },
              { label: "Email", value: account.contact_email, href: account.contact_email ? `mailto:${account.contact_email}` : undefined },
              { label: "Phone", value: contactPhone, href: contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined },
              { label: "Phone type", value: account.contact_phone_type },
            ]} />
          </Section>

          <Section
            title="Company"
            action={canEdit && <SectionAction icon={Pencil} onClick={() => setEditOpen(true)}>Edit</SectionAction>}
          >
            <Fields items={[
              { label: "Legal business name", value: account.account_name },
              { label: isActive ? "Customer ID" : "Request ID", value: displayId },
              { label: "Organization type", value: account.industry },
              { label: "Business type", value: account.business_type },
              { label: "Business number", value: account.abn },
              { label: "Website", value: account.website, href: account.website ? websiteHref(account.website) : undefined },
              { label: "Business address", value: formatAddress(account), wide: true },
            ]} />
          </Section>

          <Section
            title="Billing"
            action={canEdit && <SectionAction icon={Pencil} onClick={() => setEditOpen(true)}>Edit</SectionAction>}
          >
            <Fields items={[
              { label: "Billing email", value: account.billing_email, href: account.billing_email ? `mailto:${account.billing_email}` : undefined },
              { label: "Accounts payable email", value: account.accounts_payable_email, href: account.accounts_payable_email ? `mailto:${account.accounts_payable_email}` : undefined },
            ]} />
          </Section>

          <ShipmentsSection owner={{ accountId: id }} />

          <SupportTicketsSection owner={{ accountId: id }} />

          <CorporateNotesSection corporateId={id} />

          <Section title="Activity">
            <ActivityFeed bare items={activity} isLoading={activityLoading} />
          </Section>
        </Panel>

        {/* Side column */}
        <Panel>
          {!isRejected && (
            <Section title="Pipeline">
              <StatusDot label={statusMeta.label} dotClass={statusMeta.dot} className="text-sm" />
              <p className="mt-1.5 text-sm text-muted">{statusMeta.description}</p>
              <p className="mt-3 text-xs text-muted">
                Portal access{" "}
                <span className={hasPortalAccess ? "font-medium text-green-700" : "font-medium text-foreground"}>
                  {hasPortalAccess ? "granted" : "not granted"}
                </span>
                {admin ? "" : " · no login attached yet"}
              </p>
              {lastStatusChange && (
                <p className="mt-1 text-xs text-muted">
                  Last change {fmtDate(lastStatusChange.created_at)}
                  {lastStatusChange.actor_label ? ` by ${lastStatusChange.actor_label}` : ""}
                </p>
              )}
            </Section>
          )}

          {!isRejected && <FollowUpSection account={account} canEdit={canEdit} />}

          {isActive && tierProgress && (
            <Section title="Partner tier" action={<SectionAction onClick={() => setTierSheetOpen(true)}>Details</SectionAction>}>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-foreground">{tierProgress.current.name}</p>
                <p className="text-xs tabular-nums text-muted">
                  {stats?.deliveredShipments ?? 0}{tierProgress.next ? ` / ${tierProgress.next.min_deliveries}` : ""} shipments
                </p>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-foreground/8">
                <div className="h-full rounded-full bg-primary" style={{ width: `${tierProgress.progressPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted">
                {tierProgress.next ? `Next: ${tierProgress.next.name}` : "Highest tier reached"}
              </p>
            </Section>
          )}

          <Section
            title="Portal users"
            action={canEdit && !isRejected && <SectionAction onClick={() => setAccessOpen(true)}>Manage</SectionAction>}
          >
            {(account.profiles ?? []).length === 0 ? (
              <p className="text-sm text-muted">No logins on this account.</p>
            ) : (
              <ul className="space-y-3">
                {(account.profiles ?? []).map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <UserAvatar name={p.full_name} avatarUrl={p.avatar_url} size="sm" rounded="full" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{p.full_name ?? "No name"}</p>
                      <p className="text-xs text-muted">
                        {p.company_role === "company_admin" ? "Company admin" : "Employee"} · {p.is_approved ? "can sign in" : "no access"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </Panel>
      </div>

      <TierDetailsSheet
        open={tierSheetOpen}
        onClose={() => setTierSheetOpen(false)}
        delivered={stats?.deliveredShipments ?? 0}
        tiers={tiers}
      />

      <EditCorporateCustomerSheet open={editOpen} onClose={() => setEditOpen(false)} account={account} />

      <ManageAccessSheet
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
        profiles={account.profiles ?? []}
        stageGrantsAccess={hasPortalAccess}
      />

      <RejectAccountDialog
        accountId={id}
        accountName={account.account_name}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteMut.isPending}
        title="Delete corporate customer"
        description={
          <>
            {account.account_name} will be removed from the dashboard and its logins
            disabled. Deliveries, invoices and history are kept, and this can be undone
            by an administrator. Use <em>Purge</em> for a permanent wipe.
          </>
        }
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={handleSuspend}
        loading={statusMut.isPending}
        tone="default"
        title="Suspend account"
        description={
          <>
            Suspend {account.account_name}? Portal access is paused; move them back to
            Active to restore it.
          </>
        }
        confirmLabel="Suspend"
      />

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        loading={statusMut.isPending}
        title="Deactivate account"
        description={
          <>
            Deactivate {account.account_name}? The account is marked Lost and portal
            access ends. This is reversible.
          </>
        }
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={handlePurge}
        loading={purgeMut.isPending}
        title="Purge account permanently"
        description={
          <>
            Permanently delete {account.account_name} and ALL of its data now? This
            cannot be undone.
          </>
        }
        confirmLabel="Purge now"
      />
    </div>
  );
}

/* ─── Follow-up (internal CRM — last/next contact, owner) ─────────────────── */

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function FollowUpSection({ account, canEdit }: { account: Account; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [lastContactedAt, setLastContactedAt] = useState(toDateInputValue(account.last_contacted_at));
  const [nextFollowUpAt, setNextFollowUpAt] = useState(toDateInputValue(account.next_follow_up_at));
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(account.assigned_employee_id ?? "");
  const updateMut = useUpdateAccount(account.account_id);

  const { data: employeesRes } = useAdminEmployees({ limit: 200 }, { enabled: editing });
  const employees = (employeesRes?.data ?? []).filter((e) => e.is_active);
  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: e.full_name ?? e.email,
    icon: <UserAvatar name={e.full_name} avatarUrl={e.avatar_url} size="xs" rounded="lg" />,
  }));

  function startEditing() {
    setLastContactedAt(toDateInputValue(account.last_contacted_at));
    setNextFollowUpAt(toDateInputValue(account.next_follow_up_at));
    setAssignedEmployeeId(account.assigned_employee_id ?? "");
    setEditing(true);
  }

  async function save() {
    try {
      await updateMut.mutateAsync({
        lastContactedAt:    lastContactedAt || null,
        nextFollowUpAt:     nextFollowUpAt  || null,
        assignedEmployeeId: assignedEmployeeId || null,
      });
      toast.success("Follow-up details updated");
      setEditing(false);
    } catch (err) { toast.error((err as Error).message); }
  }

  const assignedEmployee = account.assigned_employee;
  const overdue = !!account.next_follow_up_at && new Date(account.next_follow_up_at).getTime() < Date.now();

  return (
    <Section
      title="Follow-up"
      description="Internal only — not visible to the customer"
      action={canEdit && !editing && <SectionAction icon={Pencil} onClick={startEditing}>Edit</SectionAction>}
    >
      {editing ? (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted">Last contacted</span>
            <Input type="date" value={lastContactedAt} onChange={(e) => setLastContactedAt(e.target.value)} className="mt-1 h-8 rounded-md text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Next follow-up</span>
            <Input type="date" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} className="mt-1 h-8 rounded-md text-sm" />
          </label>
          <div>
            <span className="text-xs text-muted">Assigned to</span>
            <div className="mt-1">
              <SearchableSelect
                value={assignedEmployeeId}
                onValueChange={setAssignedEmployeeId}
                options={employeeOptions}
                placeholder="Unassigned"
                searchPlaceholder="Search employees…"
                emptyText="No active employees"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <ActionButton onClick={() => setEditing(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={save} disabled={updateMut.isPending}>Save</ActionButton>
          </div>
        </div>
      ) : (
        <Fields
          columns={1}
          items={[
            { label: "Last contacted", value: account.last_contacted_at ? fmtDate(account.last_contacted_at) : null },
            {
              label: "Next follow-up",
              value: account.next_follow_up_at
                ? <span className={overdue ? "font-medium text-red-600" : undefined}>{fmtDate(account.next_follow_up_at)}{overdue ? " · overdue" : ""}</span>
                : null,
            },
            {
              label: "Assigned to",
              value: assignedEmployee ? (
                <span className="inline-flex items-center gap-2">
                  <UserAvatar name={assignedEmployee.full_name} avatarUrl={assignedEmployee.avatar_url} size="xs" rounded="full" />
                  {assignedEmployee.full_name ?? "No name"}
                </span>
              ) : null,
            },
          ]}
        />
      )}
    </Section>
  );
}

/* ─── Manage Access sheet ─────────────────────────────────────────────────── */

function ManageAccessSheet({ open, onClose, profiles, stageGrantsAccess }: {
  open: boolean; onClose: () => void; profiles: AccountProfile[]; stageGrantsAccess: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} size="md">
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-card-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Manage portal access</h2>
          <p className="mt-0.5 text-xs text-muted">Users who can sign in to this company&apos;s portal</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!stageGrantsAccess && (
            <p className="mb-4 border-l-2 border-amber-400 bg-amber-50/60 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20">
              Portal access follows the pipeline stage. Move this company to
              <span className="font-medium"> Onboarding</span> or <span className="font-medium">Active</span> to
              enable logins.
            </p>
          )}
          {profiles.length === 0 && <p className="text-sm text-muted">No users on this account.</p>}
          <ul className="divide-y divide-card-border">
            {profiles.map((p) => (
              <AccessRow key={p.id} profile={p} canToggle={stageGrantsAccess} />
            ))}
          </ul>
        </div>
      </div>
    </Sheet>
  );
}

function AccessRow({ profile, canToggle }: { profile: AccountProfile; canToggle: boolean }) {
  const approveMut = useApproveUser(profile.id);
  async function toggle(approved: boolean) {
    try {
      await approveMut.mutateAsync(approved);
      toast.success(approved ? "Access granted" : "Access revoked");
    } catch (err) { toast.error((err as Error).message); }
  }
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="sm" rounded="full" />
        <div>
          <p className="text-sm text-foreground">{profile.full_name ?? "No name"}</p>
          <p className="text-xs text-muted">
            {profile.company_role === "company_admin" ? "Company admin" : "Employee"}
            {" · "}{profile.is_approved ? "can sign in" : "no access"}
          </p>
        </div>
      </div>
      {canToggle && (profile.is_approved ? (
        <Button size="sm" variant="outline" onClick={() => toggle(false)} disabled={approveMut.isPending}
          className="h-8 rounded-md text-xs text-red-600 hover:bg-red-50">Revoke</Button>
      ) : (
        <Button size="sm" onClick={() => toggle(true)} disabled={approveMut.isPending} className="h-8 rounded-md text-xs">Grant</Button>
      ))}
    </li>
  );
}
