"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { create } from "zustand";

import { ArrowLeft, Save } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type LoadStatus =
  | "Pending"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

type ServiceType =
  | "Freight"
  | "Last Mile";

type Mode =
  | "Road"
  | "Air"
  | "Rail"
  | "Sea";

type Load = {
  id: string;
  loadNumber: string;
  shipper: string;
  status: LoadStatus;
  serviceType: ServiceType;
  mode: Mode;
  origin: string;
  destination: string;
};

/* -------------------------------------------------------------------------- */
/*                                    ZOD                                     */
/* -------------------------------------------------------------------------- */

const loadSchema = z.object({
  loadNumber: z
    .string()
    .min(3, "Load number required"),

  shipper: z
    .string()
    .min(2, "Shipper required"),

  status: z.enum([
    "Pending",
    "In Transit",
    "Delivered",
    "Cancelled",
  ]),

  serviceType: z.enum([
    "Freight",
    "Last Mile",
  ]),

  mode: z.enum([
    "Road",
    "Air",
    "Rail",
    "Sea",
  ]),

  origin: z
    .string()
    .min(2, "Origin required"),

  destination: z
    .string()
    .min(2, "Destination required"),
});

type LoadFormValues = z.infer<
  typeof loadSchema
>;

/* -------------------------------------------------------------------------- */
/*                                  ZUSTAND                                   */
/* -------------------------------------------------------------------------- */

type LoadStore = {
  loads: Load[];

  addLoad: (load: Load) => void;
};

const useLoadStore = create<LoadStore>(
  (set) => ({
    loads: [],

    addLoad: (load) =>
      set((state) => ({
        loads: [...state.loads, load],
      })),
  })
);

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function CreateLoadPage() {
  const router = useRouter();

  const { addLoad } = useLoadStore();

  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadSchema),

    defaultValues: {
      loadNumber: "",
      shipper: "",
      status: "Pending",
      serviceType: "Freight",
      mode: "Road",
      origin: "",
      destination: "",
    },
  });

  function onSubmit(
    values: LoadFormValues
  ) {
    addLoad({
      id: crypto.randomUUID(),
      ...values,
    });

    toast.success(
      "Load created successfully"
    );

    router.push("/admin/loads");
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Operations
            </p>

            <h1 className="mt-2 text-4xl font-bold text-foreground">
              Create Loads
            </h1>

            <p className="mt-2 text-muted">
              Create and manage shipment
              operations.
            </p>
          </div>
        </div>

        {/* FORM CARD */}

        <Card className="border-card-border bg-card shadow-md">
          <CardHeader className="border-b border-card-border">
            <CardTitle>
              Load Information
            </CardTitle>

            <CardDescription>
              Enter shipment and logistics
              details for the new load.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  onSubmit
                )}
                className="space-y-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {/* LOAD NUMBER */}

                  <CustomField
                    form={form}
                    name="loadNumber"
                    label="Load Number"
                  />

                  {/* SHIPPER */}

                  <CustomField
                    form={form}
                    name="shipper"
                    label="Shipper"
                  />

                  {/* STATUS */}

                  <CustomSelect
                    form={form}
                    name="status"
                    label="Status"
                    options={[
                      "Pending",
                      "In Transit",
                      "Delivered",
                      "Cancelled",
                    ]}
                  />

                  {/* SERVICE TYPE */}

                  <CustomSelect
                    form={form}
                    name="serviceType"
                    label="Service Type"
                    options={[
                      "Freight",
                      "Last Mile",
                    ]}
                  />

                  {/* MODE */}

                  <CustomSelect
                    form={form}
                    name="mode"
                    label="Mode"
                    options={[
                      "Road",
                      "Air",
                      "Rail",
                      "Sea",
                    ]}
                  />

                  {/* ORIGIN */}

                  <CustomField
                    form={form}
                    name="origin"
                    label="Origin"
                  />

                  {/* DESTINATION */}

                  <CustomField
                    form={form}
                    name="destination"
                    label="Destination"
                  />
                </div>

                {/* ACTIONS */}

                <div className="flex justify-end gap-3 border-t border-card-border pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        "/admin/loads"
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="bg-primary text-sidebar hover:bg-primary/90"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Load
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CUSTOM FIELD                                 */
/* -------------------------------------------------------------------------- */

function CustomField({
  form,
  name,
  label,
}: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>

          <FormControl>
            <Input
              {...field}
              className="h-11 border-card-border bg-background"
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                               CUSTOM SELECT                                */
/* -------------------------------------------------------------------------- */

function CustomSelect({
  form,
  name,
  label,
  options,
}: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>

          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger className="h-11 border-card-border bg-background">
                <SelectValue
                  placeholder={label}
                />
              </SelectTrigger>
            </FormControl>

            <SelectContent>
              {options.map(
                (option: string) => (
                  <SelectItem
                    key={option}
                    value={option}
                  >
                    {option}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}