"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Send, Trash2, UserCircle2 } from "lucide-react";

import { UserAvatar } from "@/components/ui/user-avatar";
import { CustomerRewardsPanel } from "@/components/rewards/customer-rewards-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditProfileDialog } from "@/components/admin/edit-profile-dialog";
import { InvitationStatusBadge } from "@/components/accounts/invitation-status-badge";
import {
  ActionButton, Fields, MoreActions, Panel, ProfileHeader, Section, SectionAction,
} from "@/components/profile/profile-kit";
import { ShipmentsSection, SupportTicketsSection } from "@/components/profile/customer-records";

import { useUser, useUpdateUser, useDeleteUser, useSendUserInvitation } from "@/hooks/use-users";
import { usePermission } from "@/hooks/use-permission";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ResidentialCustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const { data: userRes, isLoading: userLoading } = useUser(customerId);
  const customer = userRes?.data;

  const canEdit = usePermission("customers.edit");
  const canDelete = usePermission("customers.delete");
  const updateMut = useUpdateUser(customerId);
  const deleteMut = useDeleteUser();
  const inviteMut = useSendUserInvitation(customerId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function saveEdit(values: { fullName?: string; phone?: string; email?: string }) {
    try {
      await updateMut.mutateAsync(values);
      if (values.email) {
        toast.success(`Customer updated — click Send credentials to email ${values.email} an activation link`);
      } else {
        toast.success("Customer updated");
      }
      setEditOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function sendInvitation() {
    try {
      await inviteMut.mutateAsync();
      toast.success(`Invitation emailed to ${customer?.email}`);
      setInviteOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function confirmDelete() {
    try {
      await deleteMut.mutateAsync(customerId);
      toast.success("Customer removed");
      router.push("/admin/residential");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <UserCircle2 className="h-6 w-6 text-muted" />
        <p className="text-sm font-medium text-foreground">Customer not found</p>
        <button type="button" onClick={() => router.push("/admin/residential")} className="text-sm text-primary hover:underline">
          Back to Residential Customers
        </button>
      </div>
    );
  }

  const name = customer.fullName ?? "No name";
  const invitationStatus = customer.invitation?.status ?? "not_sent";
  const hasEmail = !!customer.email;
  const inviteSent = invitationStatus === "sent" || invitationStatus === "expired";
  // Nothing to send once they have signed in / activated.
  const canInvite = canEdit && invitationStatus !== "activated";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <ProfileHeader
        backHref="/admin/residential"
        backLabel="Residential customers"
        media={<UserAvatar name={customer.fullName} avatarUrl={customer.avatarUrl} size="lg" rounded="lg" />}
        title={name}
        meta={[
          "Residential customer",
          customer.email || "Books by phone",
          `Registered ${formatDate(customer.createdAt)}`,
        ]}
        actions={
          <>
            {canInvite && (
              <ActionButton
                icon={Send}
                variant="primary"
                onClick={() => setInviteOpen(true)}
                disabled={inviteMut.isPending || !hasEmail}
              >
                {inviteSent ? "Resend invitation" : "Send credentials"}
              </ActionButton>
            )}
            {canEdit && (
              <ActionButton icon={Pencil} variant={canInvite ? "secondary" : "primary"} onClick={() => setEditOpen(true)}>
                Edit customer
              </ActionButton>
            )}
            <MoreActions
              actions={canDelete ? [{ label: "Delete customer", icon: Trash2, onClick: () => setDeleteOpen(true), danger: true }] : []}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <Panel>
          <Section
            title="Contact"
            action={canEdit && <SectionAction icon={Pencil} onClick={() => setEditOpen(true)}>Edit</SectionAction>}
          >
            <Fields items={[
              { label: "Full name", value: customer.fullName },
              { label: "Email", value: customer.email, href: customer.email ? `mailto:${customer.email}` : undefined },
              { label: "Phone", value: customer.phone, href: customer.phone ? `tel:${customer.phone.replace(/\s+/g, "")}` : undefined },
            ]} />
          </Section>

          <ShipmentsSection owner={{ customerId }} title="Deliveries" />
          <SupportTicketsSection owner={{ customerId }} />
        </Panel>

        {/* Side column */}
        <Panel>
          <CustomerRewardsPanel profileId={customerId} />
          <Section title="Account">
            <Fields
              columns={1}
              items={[
                { label: "Customer type", value: "Residential" },
                { label: "Sign-in", value: invitationStatus === "activated" ? "Has a login" : customer.hasLogin === false ? "No login — books by phone" : "No login yet" },
                { label: "Registered", value: formatDate(customer.createdAt) },
              ]}
            />
            {invitationStatus !== "activated" && (
              <div className="mt-3 space-y-1.5">
                <InvitationStatusBadge status={invitationStatus} />
                <p className="text-xs text-muted">
                  {!hasEmail
                    ? "Add an email address (Edit customer), then send credentials so they can sign in."
                    : invitationStatus === "not_sent"
                      ? `Nothing has been sent to ${customer.email} yet. Click Send credentials to email an activation link.`
                      : invitationStatus === "sent"
                        ? `Sent ${formatDate(customer.invitation!.sent_at!)} · link valid until ${formatDate(customer.invitation!.expires_at!)}.`
                        : `The link sent ${formatDate(customer.invitation!.sent_at!)} has expired. Resend to give them a new one.`}
                </p>
              </div>
            )}
          </Section>
        </Panel>
      </div>

      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={saveEdit}
        initial={{ fullName: customer.fullName, phone: customer.phone }}
        loading={updateMut.isPending}
        title="Edit customer"
        showEmail={customer.hasLogin === false}
      />
      <ConfirmDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onConfirm={sendInvitation}
        loading={inviteMut.isPending}
        title={inviteSent ? "Resend invitation" : "Send credentials"}
        description={
          <>
            Email {customer.fullName ? `${customer.fullName} (${customer.email})` : customer.email} a secure link to
            activate their account and choose their own password. The link works once and expires in 7 days.
            {inviteSent ? " Any earlier link stops working." : ""}
          </>
        }
        confirmLabel={inviteSent ? "Resend" : "Send invitation"}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteMut.isPending}
        title="Delete customer"
        description={
          <>
            {customer.fullName ?? customer.email} will be removed from the dashboard
            and can no longer sign in. Their deliveries and history are kept and this
            can be undone by an administrator.
          </>
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
