"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyOptionSelect } from "@/components/ui/company-option-select";
import { ProvinceCitySelect } from "@/components/ui/province-city-select";
import { ORGANIZATION_TYPES, PHONE_TYPES } from "@/lib/corporate-options";
import { useUpdateAccount } from "@/hooks/use-accounts";
import type { Account, UpdateAccountDto } from "@/types/api.types";

type Props = { open: boolean; onClose: () => void; account: Account };

function fromAccount(a: Account) {
  return {
    accountName: a.account_name,
    industry: a.industry ?? "",
    businessType: a.business_type ?? "",
    abn: a.abn ?? "",
    website: a.website ?? "",
    contactName: a.contact_name ?? "",
    contactEmail: a.contact_email ?? "",
    contactPhone: a.contact_phone ?? "",
    contactPhoneType: a.contact_phone_type ?? "",
    addressLine1: a.address_line1 ?? "",
    addressCity: a.address_city ?? "",
    addressState: a.address_state ?? "",
    addressPostcode: a.address_postcode ?? "",
    billingEmail: a.billing_email ?? "",
    accountsPayableEmail: a.accounts_payable_email ?? "",
  };
}
type FormState = ReturnType<typeof fromAccount>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Edits the whole company profile from the admin detail page. Every field is
// sent; a blank field clears that value on the server.
export function EditCorporateCustomerSheet({ open, onClose, account }: Props) {
  const updateMut = useUpdateAccount(account.account_id);
  const [form, setForm] = useState<FormState>(() => fromAccount(account));

  useEffect(() => {
    if (open) setForm(fromAccount(account));
  }, [open, account]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()]),
    ) as FormState;

    if (trimmed.accountName.length < 2) return void toast.error("Company name is required");
    for (const [label, value] of [
      ["contact email", trimmed.contactEmail],
      ["billing email", trimmed.billingEmail],
      ["accounts payable email", trimmed.accountsPayableEmail],
    ] as const) {
      if (value && !EMAIL_RE.test(value)) return void toast.error(`Enter a valid ${label}`);
    }
    if (trimmed.website && !/^https?:\/\/\S+\.\S+/.test(trimmed.website)) {
      return void toast.error("Website must start with http:// or https://");
    }

    try {
      await updateMut.mutateAsync(trimmed satisfies UpdateAccountDto);
      toast.success("Company profile updated");
      onClose();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to update company profile");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="shrink-0 border-b border-card-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Pencil className="h-4 w-4 text-muted" />
            Edit Company Profile
          </h2>
          <p className="mt-0.5 text-xs text-muted">{account.account_name}</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <Section title="Company">
            <Field id="edit-name" label="Company name *" value={form.accountName} onChange={(v) => set("accountName", v)} className="sm:col-span-2" />
            <div className="space-y-1.5">
              <Label>Organization type</Label>
              <CompanyOptionSelect value={form.industry} onChange={(v) => set("industry", v)} options={ORGANIZATION_TYPES} placeholder="Select organization type" />
            </div>
            <Field id="edit-business-type" label="Business type" placeholder="e.g. Corporation" value={form.businessType} onChange={(v) => set("businessType", v)} />
            <Field id="edit-abn" label="Business number" value={form.abn} onChange={(v) => set("abn", v)} />
            <Field id="edit-website" label="Website" placeholder="https://" value={form.website} onChange={(v) => set("website", v)} />
          </Section>

          <Section title="Primary contact">
            <Field id="edit-contact-name" label="Contact name" value={form.contactName} onChange={(v) => set("contactName", v)} />
            <Field id="edit-contact-email" label="Email address" type="email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} />
            <Field id="edit-contact-phone" label="Phone number" value={form.contactPhone} onChange={(v) => set("contactPhone", v)} />
            <div className="space-y-1.5">
              <Label>Phone type</Label>
              <CompanyOptionSelect value={form.contactPhoneType} onChange={(v) => set("contactPhoneType", v)} options={PHONE_TYPES} placeholder="Select phone type" />
            </div>
          </Section>

          <Section title="Business address">
            <Field id="edit-address" label="Street address" value={form.addressLine1} onChange={(v) => set("addressLine1", v)} className="sm:col-span-2" />
            <ProvinceCitySelect
              province={form.addressState}
              city={form.addressCity}
              onProvinceChange={(v) => set("addressState", v)}
              onCityChange={(v) => set("addressCity", v)}
              labelClassName="text-sm font-medium leading-none"
              wrapperClassName="contents"
            />
            <Field id="edit-postcode" label="Postal code" value={form.addressPostcode} onChange={(v) => set("addressPostcode", v)} />
          </Section>

          <Section title="Billing">
            <Field id="edit-billing-email" label="Billing email" type="email" value={form.billingEmail} onChange={(v) => set("billingEmail", v)} />
            <Field id="edit-ap-email" label="Accounts payable email" type="email" value={form.accountsPayableEmail} onChange={(v) => set("accountsPayableEmail", v)} />
          </Section>
        </div>

        <div className="shrink-0 border-t border-card-border px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-lg" onClick={onClose} disabled={updateMut.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg bg-primary text-sidebar hover:bg-primary/85" disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
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
