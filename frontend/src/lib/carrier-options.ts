// Dropdown options for Admin → Carriers.

import { PROVINCES } from "@/lib/corporate-options";

// Equipment is picked category-first: choosing a category shows only that
// category's equipment. Names are unique across categories, so a carrier
// stores a flat list of equipment names.
export const EQUIPMENT_OTHER = "Other (Specify)";

export const EQUIPMENT_CATEGORIES = {
  "Standard Freight": [
    "Dry Van",
    "Reefer (Refrigerated Trailer)",
    "Flatbed",
    "Step Deck",
    "Straight Truck / Box Truck",
    "Cargo Van",
    "Sprinter Van",
    "Dump Truck",
    "Tanker",
    "Intermodal Container Chassis",
  ],
  "Auto Hauling": [
    "Open Car Carrier",
    "Enclosed Auto Transporter",
    "Single-Car Trailer",
    "Multi-Car Hauler",
    "Flatbed Auto Transport",
  ],
  "Heavy Haul / Specialized Transport": [
    "Lowboy Trailer",
    "RGN (Removable Gooseneck Trailer)",
    "Double Drop Trailer",
    "Extendable Flatbed",
    "Extendable Step Deck",
    "Multi-Axle Trailer",
    "Hydraulic Platform Trailer",
    "Heavy Haul Tractor / Power Unit",
  ],
  Other: [EQUIPMENT_OTHER],
} as const satisfies Record<string, readonly string[]>;

export type EquipmentCategory = keyof typeof EQUIPMENT_CATEGORIES;
export const EQUIPMENT_CATEGORY_NAMES = Object.keys(EQUIPMENT_CATEGORIES) as EquipmentCategory[];

/** The category an equipment name belongs to (null for unknown legacy values). */
export function equipmentCategory(name: string): EquipmentCategory | null {
  return EQUIPMENT_CATEGORY_NAMES.find((c) => (EQUIPMENT_CATEGORIES[c] as readonly string[]).includes(name)) ?? null;
}

export const SERVICES_OFFERED = [
  "Full Truckload (FTL)",
  "Less Than Truckload (LTL)",
  "Dedicated Transportation",
  "Expedited / Time-Sensitive Delivery",
  "Specialized Transportation",
  "Heavy Haul",
  "Auto Hauling",
  "Temperature-Controlled Transportation",
  "Cross-Border Transportation",
  "Local / Regional Transportation",
  "Long-Haul Transportation",
  "Last-Mile Delivery",
  "Intermodal Transportation",
  "Other",
] as const;

export const DOCUMENT_TYPES = [
  "Certificate of Insurance",
  "Operating Authority / Carrier Registration",
  "Safety Certificate / Safety Rating",
  "CVOR (where applicable)",
  "Operating Permits",
  "Signed Carrier Agreement",
  "Workers' Compensation Clearance (where applicable)",
  "Specialized Certifications / Permits",
  "Other Supporting Documents",
] as const;

// Routes can run into the US, so the lane dropdown lists provinces and states.
export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
] as const;

export const ROUTE_REGION_OPTIONS = [
  ...PROVINCES.map((p) => ({ value: p, label: p })),
  ...US_STATES.map((s) => ({ value: s, label: `${s} (US)` })),
];

// Documents within this many days of expiry are flagged.
export const DOCUMENT_WARNING_DAYS = 30;

export type ExpiryState = "expired" | "soon" | "ok";

/** Expiry flag for a YYYY-MM-DD date; null when there is no expiry date. */
export function expiryState(expiry: string | null): ExpiryState | null {
  if (!expiry) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(`${expiry}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "expired";
  if (days <= DOCUMENT_WARNING_DAYS) return "soon";
  return "ok";
}

/** Worst expiry flag across a carrier's documents ("expired" beats "soon"). */
export function worstExpiry(documents: { expiry_date: string | null }[]): ExpiryState | null {
  const states = documents.map((d) => expiryState(d.expiry_date));
  if (states.includes("expired")) return "expired";
  if (states.includes("soon")) return "soon";
  return null;
}

export function formatDay(d: string | null): string {
  if (!d) return "—";
  return new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
  });
}
