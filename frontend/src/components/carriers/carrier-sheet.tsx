"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanyOptionSelect } from "@/components/ui/company-option-select";
import { ProvinceCitySelect } from "@/components/ui/province-city-select";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { CarrierStatusSelect } from "@/components/carriers/carrier-status";
import { EquipmentPicker } from "@/components/carriers/equipment-picker";
import { RoutesEditor, newRouteDraft, type RouteDraft } from "@/components/carriers/routes-editor";
import { PHONE_TYPES } from "@/lib/corporate-options";
import { EQUIPMENT_OTHER, SERVICES_OFFERED } from "@/lib/carrier-options";
import { useCreateCarrier, useUpdateCarrier } from "@/hooks/use-carriers";
import { CARRIER_STATUS_META, type Carrier, type CarrierStatus, type CreateCarrierDto } from "@/types/api.types";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Edit this carrier; omit to add a new one. */
  carrier?: Carrier | null;
};

const EMPTY = {
  carrierName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactPhoneType: "",
  website: "",
  addressLine1: "",
  addressCity: "",
  addressProvince: "",
  addressPostcode: "",
  equipmentOther: "",
  lastContactedAt: "",
  nextFollowUpAt: "",
  notes: "",
};
type FormState = typeof EMPTY;

function fromCarrier(c: Carrier): FormState {
  return {
    carrierName: c.carrier_name,
    contactName: c.contact_name ?? "",
    contactEmail: c.contact_email ?? "",
    contactPhone: c.contact_phone ?? "",
    contactPhoneType: c.contact_phone_type ?? "",
    website: c.website ?? "",
    addressLine1: c.address_line1 ?? "",
    addressCity: c.address_city ?? "",
    addressProvince: c.address_province ?? "",
    addressPostcode: c.address_postcode ?? "",
    equipmentOther: c.equipment_other ?? "",
    lastContactedAt: c.last_contacted_at ?? "",
    nextFollowUpAt: c.next_follow_up_at ?? "",
    notes: c.notes ?? "",
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Add or edit the whole carrier profile. Documents are managed on the
// carrier's page (they need the saved carrier to attach to).
export function CarrierSheet({ open, onClose, carrier }: Props) {
  const router = useRouter();
  const createMut = useCreateCarrier();
  const updateMut = useUpdateCarrier();
  const saving = createMut.isPending || updateMut.isPending;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<CarrierStatus>("prospect");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [routes, setRoutes] = useState<RouteDraft[]>([]);

  // Load the record (or a blank form) each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setForm(carrier ? fromCarrier(carrier) : EMPTY);
    setStatus(carrier?.status ?? "prospect");
    setEquipment(carrier?.equipment_types ?? []);
    setServices(carrier?.services_offered ?? []);
    setRoutes(
      carrier?.routes.length
        ? carrier.routes.map((r) => ({
            key: r.id,
            province: r.province ?? "",
            originCity: r.origin_city ?? "",
            destinationCity: r.destination_city ?? "",
            crossBorder: r.cross_border,
          }))
        : [newRouteDraft()],
    );
  }, [open, carrier]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as FormState;

    if (trimmed.carrierName.length < 2) return void toast.error("Company name is required");
    if (trimmed.contactEmail && !EMAIL_RE.test(trimmed.contactEmail)) return void toast.error("Enter a valid email address");

    // Send every field (blank clears it) so edits can remove values too.
    const dto: CreateCarrierDto = {
      ...trimmed,
      status,
      equipmentTypes: equipment,
      equipmentOther: equipment.includes(EQUIPMENT_OTHER) ? trimmed.equipmentOther : "",
      servicesOffered: services,
      routes: routes.map((r) => ({
        province: r.province,
        originCity: r.originCity.trim(),
        destinationCity: r.destinationCity.trim(),
        crossBorder: r.crossBorder,
      })),
    };

    try {
      if (carrier) {
        await updateMut.mutateAsync({ id: carrier.id, dto });
        toast.success(`${trimmed.carrierName} updated`);
        onClose();
      } else {
        const res = await createMut.mutateAsync(dto);
        toast.success(`${trimmed.carrierName} added — you can upload documents now`);
        onClose();
        if (res?.data?.id) router.push(`/admin/carriers/${res.data.id}`);
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save carrier");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="shrink-0 border-b border-card-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Truck className="h-4 w-4 text-muted" />
            {carrier ? "Edit Carrier" : "Add Carrier"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            An independent trucking company — not an LLC employee. No login is created.
          </p>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto p-6">
          <Section title="Company">
            <Field id="car-name" label="Company name *" value={form.carrierName} onChange={(v) => set("carrierName", v)} className="sm:col-span-2" />
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Carrier status</Label>
              <div>
                <CarrierStatusSelect value={status} onChange={setStatus} />
              </div>
              <p className="text-xs text-muted">{CARRIER_STATUS_META[status].description}</p>
            </div>
            <Field id="car-website" label="Company website" placeholder="https://" value={form.website} onChange={(v) => set("website", v)} className="sm:col-span-2" />
          </Section>

          <Section title="Contact">
            <Field id="car-contact-name" label="Contact person" value={form.contactName} onChange={(v) => set("contactName", v)} />
            <Field id="car-contact-email" label="Email address" type="email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} />
            <Field id="car-contact-phone" label="Phone number" value={form.contactPhone} onChange={(v) => set("contactPhone", v)} />
            <div className="space-y-1.5">
              <Label>Phone type</Label>
              <CompanyOptionSelect value={form.contactPhoneType} onChange={(v) => set("contactPhoneType", v)} options={PHONE_TYPES} placeholder="Select phone type" />
            </div>
          </Section>

          <Section title="Business address">
            <Field id="car-address" label="Street address" value={form.addressLine1} onChange={(v) => set("addressLine1", v)} className="sm:col-span-2" />
            <ProvinceCitySelect
              province={form.addressProvince}
              city={form.addressCity}
              onProvinceChange={(v) => set("addressProvince", v)}
              onCityChange={(v) => set("addressCity", v)}
              labelClassName="text-sm font-medium leading-none"
              wrapperClassName="contents"
            />
            <Field id="car-postcode" label="Postal code" value={form.addressPostcode} onChange={(v) => set("addressPostcode", v)} />
          </Section>

          <Block title="Equipment / truck types">
            <EquipmentPicker
              selected={equipment}
              onChange={setEquipment}
              other={form.equipmentOther}
              onOtherChange={(v) => set("equipmentOther", v)}
            />
          </Block>

          <Block title="Services offered">
            <MultiSelectDropdown
              options={SERVICES_OFFERED}
              selected={services}
              onChange={setServices}
              label="Services offered"
              placeholder="Select services"
            />
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <span key={s} className="rounded-full border border-card-border bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground">{s}</span>
                ))}
              </div>
            )}
          </Block>

          <Block title="Service areas / operating lanes">
            <RoutesEditor routes={routes} onChange={setRoutes} />
          </Block>

          <Section title="Follow-up">
            <Field id="car-last-contact" label="Last contact date" type="date" value={form.lastContactedAt} onChange={(v) => set("lastContactedAt", v)} />
            <Field id="car-next-follow-up" label="Next follow-up date" type="date" value={form.nextFollowUpAt} onChange={(v) => set("nextFollowUpAt", v)} />
          </Section>

          <div className="space-y-1.5">
            <Label htmlFor="car-notes">Notes</Label>
            <Textarea id="car-notes" rows={4} maxLength={5000} placeholder="Rates, reliability, anything worth knowing" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="rounded-lg" />
          </div>
        </div>

        <div className="shrink-0 border-t border-card-border px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-lg" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg bg-primary text-sidebar hover:bg-primary/85" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : carrier ? "Save changes" : "Add carrier"}
            </Button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      {children}
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", placeholder, className }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg" />
    </div>
  );
}
