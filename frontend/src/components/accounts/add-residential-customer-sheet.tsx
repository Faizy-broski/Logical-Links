"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCircle2 } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateResidentialCustomer } from "@/hooks/use-users";

type Props = { open: boolean; onClose: () => void };

const EMPTY = { fullName: "", phone: "", email: "" };

// Adds a residential customer from the admin side — for people who book by
// phone and have no email or computer. Email is optional; without one the
// customer simply has no online login.
export function AddResidentialCustomerSheet({ open, onClose }: Props) {
  const router = useRouter();
  const createMut = useCreateResidentialCustomer();
  const [form, setForm] = useState(EMPTY);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.fullName.trim().length < 2) return toast.error("Name is required");
    if (form.phone.trim().length < 7) return toast.error("Phone number is required");
    try {
      const res = await createMut.mutateAsync({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
      });
      toast.success(`${form.fullName.trim()} added`);
      setForm(EMPTY);
      onClose();
      if (res?.data?.id) router.push(`/admin/residential/${res.data.id}`);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to add customer");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="shrink-0 border-b border-card-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserCircle2 className="h-4 w-4 text-muted" />
            Add Residential Customer
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            For customers who book by phone. An email is optional — without one they
            have no online login, and you book their deliveries for them.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="space-y-1.5">
            <Label htmlFor="res-name">Full name *</Label>
            <Input id="res-name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-phone">Phone number *</Label>
            <Input id="res-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-email">Email <span className="font-normal text-muted">(optional)</span></Label>
            <Input id="res-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="rounded-lg" />
          </div>
        </div>

        <div className="shrink-0 border-t border-card-border px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-lg" onClick={onClose} disabled={createMut.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg bg-primary text-sidebar hover:bg-primary/85" disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add customer"}
            </Button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}
