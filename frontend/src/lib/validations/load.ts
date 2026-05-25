import { z } from "zod";

export const loadSchema = z.object({
  loadNumber: z
    .string()
    .min(3, "Load number required"),

  shipperId: z
    .string()
    .min(1, "Please select a shipper"),

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

export type LoadFormValues =
  z.infer<typeof loadSchema>;