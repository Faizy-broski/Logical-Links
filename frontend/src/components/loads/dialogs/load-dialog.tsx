"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/loads/select-field";
import { SHIPPERS } from "@/constants/shippers";
import { loadSchema, LoadFormValues } from "@/lib/validations/load";
import { Load } from "@/types/load.types";
import { Lock } from "lucide-react";

export function LoadDialog({
  open,
  onClose,
  title,
  description,
  defaultValues,
  isAdmin,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  defaultValues?: Partial<Load>;
  isAdmin: boolean;
  onSubmit: (values: LoadFormValues) => void;
}) {
  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadSchema),
    defaultValues: {
      loadNumber: defaultValues?.loadNumber ?? "",
      shipperId: defaultValues?.shipperId ?? "",
      status: defaultValues?.status ?? "Pending",
      serviceType: defaultValues?.serviceType ?? "Freight",
      mode: defaultValues?.mode ?? "Road",
      origin: defaultValues?.origin ?? "",
      destination: defaultValues?.destination ?? "",
    },
  });

  useEffect(() => {
    if (open) form.reset(defaultValues as any);
  }, [open]);

  return (
     <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl border border-card-border bg-card p-0 shadow-2xl"
        style={{ borderRadius: "var(--radius-md, 16px)" }}
      >
        <DialogHeader className="border-b border-card-border px-7 py-5">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 py-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div className="grid gap-5 grid-cols-2">
                {/* Load Number */}
                <FormField
                  control={form.control}
                  name="loadNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Load Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="LD-XXXX"
                          className="rounded-[10px] border-card-border bg-background text-sm focus-visible:ring-primary/40"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Shipper — dropdown from SHIPPERS list */}
                <FormField
                  control={form.control}
                  name="shipperId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Shipper
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-[10px] border-card-border bg-background text-sm focus:ring-primary/40">
                            <SelectValue placeholder="Select a shipper" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-card-border bg-card">
                          {SHIPPERS.map((s) => (
                            <SelectItem
                              key={s.id}
                              value={s.id}
                              className="text-sm text-foreground focus:bg-background"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Status — admin only can set freely; shipper locked to Pending on create */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isAdmin && !defaultValues}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-[10px] border-card-border bg-background text-sm focus:ring-primary/40">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-card-border bg-card">
                          {[
                            "Pending",
                            "In Transit",
                            "Delivered",
                            "Cancelled",
                          ].map((o) => (
                            <SelectItem
                              key={o}
                              value={o}
                              className="text-sm text-foreground focus:bg-background"
                            >
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <SelectField
                  form={form}
                  name="serviceType"
                  label="Service Type"
                  options={["Freight", "Last Mile"]}
                />
                <SelectField
                  form={form}
                  name="mode"
                  label="Mode"
                  options={["Road", "Air", "Rail", "Sea"]}
                />

                {/* Origin */}
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Origin
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="City"
                          className="h-11 w-full rounded-[10px] border-card-border bg-background text-sm focus-visible:ring-primary/40"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Destination */}
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Destination
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="City"
                          className="h-11 w-full rounded-[10px] border-card-border bg-background text-sm focus-visible:ring-primary/40"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Private notice for shipper */}
              {!isAdmin && (
                <div className="flex items-center gap-2 rounded-[10px] border border-warning/20 bg-warning/5 px-4 py-2.5 text-sm text-yellow-700">
                  <Lock className="h-4 w-4 shrink-0" />
                  This load will be marked as <strong>private</strong> — visible
                  only to you, not the admin.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-[10px] border-card-border text-foreground hover:bg-background"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-[10px] bg-primary px-6 text-sidebar hover:bg-primary/85"
                >
                  Save Load
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}