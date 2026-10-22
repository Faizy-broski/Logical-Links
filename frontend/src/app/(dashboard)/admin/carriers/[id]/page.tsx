"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Calendar, CalendarClock, ChevronRight, Globe, Mail, MapPin,
  Pencil, Phone, PhoneCall, Trash2, Truck, UserCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CarrierSheet } from "@/components/carriers/carrier-sheet";
import { CarrierDocuments } from "@/components/carriers/carrier-documents";
import { CarrierStatusBadge, CarrierStatusSelect } from "@/components/carriers/carrier-status";
import { useCarrier, useDeleteCarrier, useUpdateCarrier } from "@/hooks/use-carriers";
import { usePermission } from "@/hooks/use-permission";
import { EQUIPMENT_CATEGORY_NAMES, EQUIPMENT_OTHER, equipmentCategory, formatDay } from "@/lib/carrier-options";
import { CARRIER_STATUS_META, type Carrier, type CarrierStatus } from "@/types/api.types";

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-card-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | null; href?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-card-border bg-background px-5 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        {value && href ? (
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-0.5 block truncate text-sm font-medium text-primary hover:underline">{value}</a>
        ) : (
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">You do not have access to Carriers.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Truck className="h-8 w-8 text-muted" />
        <p className="text-base font-semibold text-foreground">Carrier not found</p>
        <Link href="/admin/carriers" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
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

  const equipmentGroups = EQUIPMENT_CATEGORY_NAMES
    .map((c) => ({ category: c, items: carrier.equipment_types.filter((e) => equipmentCategory(e) === c) }))
    .filter((g) => g.items.length > 0);
  const otherEquipment = carrier.equipment_types.filter((e) => !equipmentCategory(e));
  const followUpOverdue = !!carrier.next_follow_up_at && new Date(`${carrier.next_follow_up_at}T23:59:59`).getTime() < Date.now();
  const editButton = canEdit && (
    <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
    </Button>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-card-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl py-4">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted">
            <Link href="/admin/carriers" className="hover:text-foreground">Carriers</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{carrier.carrier_name}</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/carriers" className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-background text-muted hover:bg-primary/5 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">{carrier.carrier_name}</h1>
                <p className="text-xs text-muted">Carrier · Added {formatDay(carrier.created_at)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canEdit ? (
                <CarrierStatusSelect value={carrier.status} onChange={setStatus} loading={updateMut.isPending} />
              ) : (
                <CarrierStatusBadge status={carrier.status} />
              )}
              {canEdit && (
                <Button onClick={() => setEditOpen(true)} className="rounded-lg bg-primary text-sidebar hover:bg-primary/85">
                  <Pencil className="mr-1.5 h-4 w-4" /> Edit Profile
                </Button>
              )}
              {canDelete && (
                <Button variant="outline" onClick={() => setDeleteOpen(true)} className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">{CARRIER_STATUS_META[carrier.status].description}</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 py-6 lg:grid-cols-2">
        <Card title="Company & contact" action={editButton}>
          <div className="space-y-3">
            <InfoRow icon={<UserCircle2 className="h-4 w-4" />} label="Contact person" value={carrier.contact_name} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email address" value={carrier.contact_email} href={carrier.contact_email ? `mailto:${carrier.contact_email}` : undefined} />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone number"
              value={carrier.contact_phone ? `${carrier.contact_phone}${carrier.contact_phone_type && carrier.contact_phone_type !== "N/A" ? ` · ${carrier.contact_phone_type}` : ""}` : null}
              href={carrier.contact_phone ? `tel:${carrier.contact_phone.replace(/\s+/g, "")}` : undefined}
            />
            <InfoRow icon={<Globe className="h-4 w-4" />} label="Company website" value={carrier.website} href={carrier.website ? websiteHref(carrier.website) : undefined} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Business address" value={formatAddress(carrier)} />
          </div>
        </Card>

        <Card title="Follow-up" action={editButton}>
          <div className="space-y-3">
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date added" value={formatDay(carrier.created_at)} />
            <InfoRow icon={<PhoneCall className="h-4 w-4" />} label="Last contact date" value={carrier.last_contacted_at ? formatDay(carrier.last_contacted_at) : null} />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Next follow-up date"
              value={carrier.next_follow_up_at ? `${formatDay(carrier.next_follow_up_at)}${followUpOverdue ? " (overdue)" : ""}` : null}
            />
          </div>
        </Card>

        <Card title="Equipment / truck types" action={editButton}>
          {equipmentGroups.length === 0 && otherEquipment.length === 0 ? (
            <p className="text-sm text-muted">No equipment recorded.</p>
          ) : (
            <div className="space-y-4">
              {equipmentGroups.map((g) => (
                <div key={g.category}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{g.category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((item) => (
                      <span key={item} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {item === EQUIPMENT_OTHER && carrier.equipment_other ? `Other: ${carrier.equipment_other}` : item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {otherEquipment.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {otherEquipment.map((item) => (
                    <span key={item} className="rounded-full border border-card-border bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground">{item}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="Services offered" action={editButton}>
          {carrier.services_offered.length === 0 ? (
            <p className="text-sm text-muted">No services recorded.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {carrier.services_offered.map((s) => (
                <span key={s} className="rounded-full border border-card-border bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground">{s}</span>
              ))}
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <Card title={`Service areas / operating lanes (${carrier.routes.length})`} action={editButton}>
            {carrier.routes.length === 0 ? (
              <p className="text-sm text-muted">No routes recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      <th className="py-2 pr-4">Province / State</th>
                      <th className="py-2 pr-4">Route</th>
                      <th className="py-2">Cross-border</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrier.routes.map((r) => (
                      <tr key={r.id} className="border-b border-card-border last:border-0">
                        <td className="py-2.5 pr-4 text-foreground">{r.province || "—"}</td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center gap-2 font-medium text-foreground">
                            {r.origin_city || "—"}
                            <ArrowRight className="h-3.5 w-3.5 text-primary" />
                            {r.destination_city || "—"}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.cross_border ? "bg-sky-50 text-sky-700" : "bg-foreground/5 text-muted"}`}>
                            {r.cross_border ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <CarrierDocuments carrierId={carrier.id} documents={carrier.documents} canEdit={canEdit} />
        </div>

        <div className="lg:col-span-2">
          <Card title="Notes" action={editButton}>
            {carrier.notes ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">{carrier.notes}</p>
            ) : (
              <p className="text-sm text-muted">No notes.</p>
            )}
          </Card>
        </div>
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
