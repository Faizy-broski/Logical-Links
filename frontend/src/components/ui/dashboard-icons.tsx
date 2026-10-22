import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logical Links dashboard icon set (client-supplied full-colour artwork).
 * Source files live in /public/dashboard-icons (transparent, 160×128), cut from
 * the client's reference sheets and scaled to equal visual weight, so icons in
 * one row look the same size. Served unoptimized: they are already small, and
 * it keeps updated artwork from being held back by the image cache. Each icon
 * takes a `className` for sizing and ignores colour / stroke props. `artwork`
 * lets shared components (KpiCard) tell these apart from lucide line icons and
 * size them accordingly.
 */
export type DashboardIconProps = { className?: string };
export type DashboardIcon = ((props: DashboardIconProps) => React.JSX.Element) & {
  artwork: true;
};

function make(name: string): DashboardIcon {
  const Icon = ({ className }: DashboardIconProps) => (
    <Image
      src={`/dashboard-icons/${name}.png`}
      alt=""
      aria-hidden
      width={160}
      height={128}
      unoptimized
      className={cn("inline-block shrink-0 object-contain", className)}
    />
  );
  return Object.assign(Icon, { artwork: true as const });
}

export function isDashboardIcon(icon: unknown): icon is DashboardIcon {
  return typeof icon === "function" && "artwork" in icon;
}

export const DashboardIcons = {
  // Deliveries
  totalDeliveriesMap: make("total-deliveries-map"),
  activeDeliveries: make("active-deliveries"),
  delivered: make("delivered"),
  totalDelivered: make("total-delivered"),
  activeDeliveriesFast: make("active-deliveries-fast"),
  deliveredAlt: make("delivered-alt"),
  totalDeliveries: make("total-deliveries"),
  inTransit: make("in-transit"),
  deliveredTransit: make("delivered-transit"),
  exceptions: make("exceptions"),
  membership: make("membership"),

  // Carriers
  totalCarriers: make("total-carriers"),
  activeCarriers: make("active-carriers"),
  onboardingCarriers: make("onboarding-carriers"),

  // Roles
  ceo: make("ceo"),
  ceoAlt: make("ceo-alt"),
  vp: make("vp"),
  manager: make("manager"),
  assistant: make("assistant"),
  driver: make("driver"),
  csr: make("csr"),
  salesMarketing: make("sales-marketing"),
  accountant: make("accountant"),
  operations: make("operations"),

  // Invoices
  invoiceTotal: make("invoice-total"),
  invoiceUnpaid: make("invoice-unpaid"),
  invoiceOverdue: make("invoice-overdue"),
  invoicePaid: make("invoice-paid"),
  invoicesDue: make("invoices-due"),

  // Quotations
  quotationTotal: make("quotation-total"),
  quotationPending: make("quotation-pending"),
  quotationAccepted: make("quotation-accepted"),
  quotationExpired: make("quotation-expired"),
  requested: make("requested"),

  // Customers & employees
  corporateCustomers: make("corporate-customers"),
  customerActive: make("customer-active"),
  pipeline: make("pipeline"),
  totalCustomers: make("total-customers"),
  totalEmployees: make("total-employees"),
  employeesActive: make("employees-active"),
  employeeDisabled: make("employee-disabled"),
  inactive: make("inactive"),

  // Support
  newSupport: make("new-support"),
  callSupport: make("call-support"),
  emailSupport: make("email-support"),
} satisfies Record<string, DashboardIcon>;
