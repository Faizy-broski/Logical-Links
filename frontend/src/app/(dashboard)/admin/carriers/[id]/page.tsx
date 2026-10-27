"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Pencil, Trash2, Truck } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CarrierSheet } from "@/components/carriers/carrier-sheet";
import { CarrierDocuments } from "@/components/carriers/carrier-documents";
import { CarrierStatusBadge, CarrierStatusSelect } from "@/components/carriers/carrier-status";
import {
  ActionButton, Fields, MoreActions, Monogram, Panel, ProfileHeader, Section, SectionAction, StatusDot,
} from "@/components/profile/profile-kit";
import { useCarrier, useDeleteCarrier, useUpdateCarrier } from "@/hooks/use-carriers";
import { usePermission } from "@/hooks/use-permission";
import {
  EQUIPMENT_CATEGORY_NAMES, EQUIPMENT_OTHER, equipmentCategory, expiryState, formatDay,
} from "@/lib/carrier-options";
import { CARRIER_STATUS_META, type Carrier, type CarrierStatus } from "@/types/api.types";

function formatAddress(c: Carrier): string | null {
  const parts = [c.address_line1, c.address_city, c.address_province, c.address_postcode].filter((v) => v && v !== "N/A");
  return parts.length ? parts.join(", ") : null;
}

function websiteHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function AdminCarrierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const canView = usePermission("carriers.view");
  const canEdit = usePermission("carriers.edit");
  const canDelete = usePermission("carriers.delete");

  const { data: res, isLoading } = useCarrier(canView ? id : "");
  const carrier = res?.data;
  const updateMut = useUpdateCarrier();
  const deleteMut = useDeleteCarrier();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted">You do not have access to Carriers.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Truck className="h-6 w-6 text-muted" />
        <p className="text-sm font-medium text-foreground">Carrier not found</p>
        <Link href="/admin/carriers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Carriers
        </Link>
      </div>
    );
  }

  async function setStatus(next: CarrierStatus) {
    try {
      await updateMut.mutateAsync({ id, dto: { status: next } });
      toast.success(`Status: ${CARRIER_STATUS_META[next].label}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDelete() {
    try {
      await deleteMut.mutateAsync(id);
      toast.success(`${carrier!.carrier_name} deleted`);
      router.push("/admin/carriers");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const statusMeta = CARRIER_STATUS_META[carrier.status];
  const place = [carrier.address_city, carrier.address_province].filter((v) => v && v !== "N/A").join(", ");
  const equipmentGroups = EQUIPMENT_CATEGORY_NAMES
    .map((c) => ({ category: c, items: carrier.equipment_types.filter((e) => equipmentCategory(e) === c) }))
    .filter((g) => g.items.length > 0);
  const otherEquipment = carrier.equipment_types.filter((e) => !equipmentCategory(e));
  const followUpOverdue = !!carrier.next_follow_up_at && new Date(`${carrier.next_follow_up_at}T23:59:59`).getTime() < Date.now();
  const docStates = carrier.documents.map((d) => expiryState(d.expiry_date));
  const verifiedDocs = carrier.documents.filter((d) => d.verification_status === "verified").length;
  const editAction = canEdit && <SectionAction icon={Pencil} onClick={() => setEditOpen(true)}>Edit</SectionAction>;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <ProfileHeader
        backHref="/admin/carriers"
        backLabel="Carriers"
        media={<Monogram name={carrier.carrier_name} />}
        title={carrier.carrier_name}
        meta={[
          <StatusDot key="s" label={statusMeta.label} dotClass={statusMeta.dot} />,
          place || null,
          `Added ${formatDay(carrier.created_at)}`,
        ]}
        actions={
          <>
            {canEdit ? (
              <CarrierStatusSelect value={carrier.status} onChange={setStatus} loading={updateMut.isPending} />
            ) : (
              <CarrierStatusBadge status={carrier.status} />
            )}
            {canEdit && (
              <ActionButton icon={Pencil} variant="primary" onClick={() => setEditOpen(true)}>
                Edit profile
              </ActionButton>
            )}
            <MoreActions
              actions={canDelete ? [{ label: "Delete carrier", icon: Trash2, onClick: () => setDeleteOpen(true), danger: true }] : []}
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <Panel>
          <Section title="Company & contact" action={editAction}>
            <Fields items={[
              { label: "Contact person", value: carrier.contact_name },
              { label: "Email", value: carrier.contact_email, href: carrier.contact_email ? `mailto:${carrier.contact_email}` : undefined },
              {
                label: "Phone",
                value: carrier.contact_phone
                  ? `${carrier.contact_phone}${carrier.contact_phone_type && carrier.contact_phone_type !== "N/A" ? ` · ${carrier.contact_phone_type}` : ""}`
                  : null,
                href: carrier.contact_phone ? `tel:${carrier.contact_phone.replace(/\s+/g, "")}` : undefined,
              },
              { label: "Company website", value: carrier.website, href: carrier.website ? websiteHref(carrier.website) : undefined },
              { label: "Business address", value: formatAddress(carrier), wide: true },
            ]} />
          </Section>

          <Section title="Equipment & services" action={editAction}>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Equipment / truck types</dt>
                <dd className="mt-1 space-y-2 text-sm text-foreground">
                  {equipmentGroups.length === 0 && otherEquipment.length === 0 ? (
                    <span className="text-muted-light">—</span>
                  ) : (
                    <>
                      {equipmentGroups.map((g) => (
                        <div key={g.category}>
                          <p className="text-xs font-medium text-muted">{g.category}</p>
                          <p>
                            {g.items
                              .map((i) => (i === EQUIPMENT_OTHER && carrier.equipment_other ? `Other: ${carrier.equipment_other}` : i))
                              .join(", ")}
                          </p>
                        </div>
                      ))}
                      {otherEquipment.length > 0 && <p>{otherEquipment.join(", ")}</p>}
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Services offered</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {carrier.services_offered.length === 0 ? (
                    <span className="text-muted-light">—</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {carrier.services_offered.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  )}
                </dd>
              </div>
            </dl>
          </Section>

          <Section title={`Service areas / operating lanes${carrier.routes.length ? ` (${carrier.routes.length})` : ""}`} action={editAction} flush>
            {carrier.routes.length === 0 ? (
              <p className="px-6 pb-5 text-sm text-muted">No routes recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-card-border text-left text-xs text-muted">
                      <th className="px-6 py-2 font-medium">Route</th>
                      <th className="px-3 py-2 font-medium">Province / State</th>
                      <th className="px-6 py-2 text-right font-medium">Cross-border</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {carrier.routes.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-2.5">
                          <span className="inline-flex items-center gap-2 text-foreground">
                            {r.origin_city || "—"}
                            <ArrowRight className="h-3.5 w-3.5 text-muted" />
                            {r.destination_city || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted">{r.province || "—"}</td>
                        <td className={`px-6 py-2.5 text-right ${r.cross_border ? "font-medium text-foreground" : "text-muted"}`}>
                          {r.cross_border ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <CarrierDocuments carrierId={carrier.id} documents={carrier.documents} canEdit={canEdit} />

          <Section title="Notes" action={editAction}>
            {carrier.notes ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{carrier.notes}</p>
            ) : (
              <p className="text-sm text-muted">No notes.</p>
            )}
          </Section>
        </Panel>

        {/* Side column */}
        <Panel>
          <Section title="Carrier pipeline">
            <StatusDot label={statusMeta.label} dotClass={statusMeta.dot} className="text-sm" />
            <p className="mt-1.5 text-sm text-muted">{statusMeta.description}</p>
          </Section>

          <Section title="Follow-up" action={editAction}>
            <Fields
              columns={1}
              items={[
                { label: "Date added", value: formatDay(carrier.created_at) },
                { label: "Last contact date", value: carrier.last_contacted_at ? formatDay(carrier.last_contacted_at) : null },
                {
                  label: "Next follow-up date",
                  value: carrier.next_follow_up_at ? (
                    <span className={followUpOverdue ? "font-medium text-red-600" : undefined}>
                      {formatDay(carrier.next_follow_up_at)}{followUpOverdue ? " · overdue" : ""}
                    </span>
                  ) : null,
                },
              ]}
            />
          </Section>

          <Section title="Documents at a glance">
            <Fields
              columns={1}
              items={[
                { label: "Uploaded", value: String(carrier.documents.length) },
                { label: "Verified", value: `${verifiedDocs} of ${carrier.documents.length}` },
                {
                  label: "Expired / expiring soon",
                  value: (
                    <span className={docStates.includes("expired") ? "font-medium text-red-600" : docStates.includes("soon") ? "font-medium text-amber-700" : undefined}>
                      {docStates.filter((s) => s === "expired").length} expired · {docStates.filter((s) => s === "soon").length} expiring
                    </span>
                  ),
                },
              ]}
            />
          </Section>
        </Panel>
      </div>

      <CarrierSheet open={editOpen} onClose={() => setEditOpen(false)} carrier={carrier} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteMut.isPending}
        title="Delete carrier"
        description={<>{carrier.carrier_name} will be removed from the Carriers list.</>}
        confirmLabel="Delete"
      />
    </div>
  );
}
