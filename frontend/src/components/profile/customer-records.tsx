"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/deliveries/deliveries-table";
import { StatusBadge } from "@/components/deliveries/status-badge";
import { SupportCaseStatusBadge } from "@/components/documents/document-status-badge";
import { DeliveryDetailsSheet } from "@/components/deliveries/sheets/delivery-details-sheet";
import { CaseDetailsSheet } from "@/components/support/case-details-sheet";
import { Section } from "@/components/profile/profile-kit";
import { useDeliveries } from "@/hooks/use-deliveries";
import { useSupportCases } from "@/hooks/use-support";
import type { Delivery, SupportCase } from "@/types/api.types";

// Shipments + support tickets for a customer profile — residential (by
// customerId / userId) or corporate (by accountId). Rows open the same detail
// sheets used elsewhere in admin.

type Owner = { customerId: string } | { accountId: string };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric" });
}

// Tables sit flush inside a profile section — no card frame of their own.
const FLUSH_TABLE = "rounded-none border-0 border-t border-card-border shadow-none";

const shipmentColumns: ColumnDef<Delivery>[] = [
  {
    id: "load_number",
    header: "Shipment #",
    cell: ({ row }) => <span className="text-sm font-medium text-foreground">{row.original.load_number}</span>,
  },
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {row.original.origin_city}, {row.original.origin_state} → {row.original.destination_city}, {row.original.destination_state}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "created_at",
    header: "Created",
    cell: ({ row }) => <span className="text-xs text-muted">{formatDate(row.original.created_at)}</span>,
  },
];

const caseColumns: ColumnDef<SupportCase>[] = [
  {
    id: "case_number",
    header: "Case #",
    cell: ({ row }) => <span className="text-sm font-medium text-foreground">{row.original.case_number}</span>,
  },
  {
    id: "subject",
    header: "Subject",
    cell: ({ row }) => <span className="block max-w-xs truncate text-sm text-foreground">{row.original.subject}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <SupportCaseStatusBadge status={row.original.status} />,
  },
  {
    id: "updated_at",
    header: "Last updated",
    cell: ({ row }) => <span className="text-xs tabular-nums text-muted">{formatDate(row.original.updated_at)}</span>,
  },
];

export function ShipmentsSection({ owner, title = "Deliveries" }: { owner: Owner; title?: string }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useDeliveries(
    { ...owner, limit: 20, sortBy: "created_at", sortDir: "desc" },
    { enabled: Object.values(owner)[0] !== "" },
  );
  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? rows.length;

  return (
    <>
      <Section title={`${title}${total ? ` (${total})` : ""}`} description={total > rows.length ? `Showing the latest ${rows.length}` : undefined} flush>
        <DataTable<Delivery>
          title=""
          columns={shipmentColumns}
          data={rows}
          isLoading={isLoading}
          onRowClick={(s) => setOpenId(s.shipment_id)}
          className={FLUSH_TABLE}
          emptyState={<span className="text-sm text-muted">No deliveries yet.</span>}
        />
      </Section>
      <DeliveryDetailsSheet
        open={!!openId}
        onClose={() => setOpenId(null)}
        loadId={openId ?? ""}
        onEditClick={() => router.push(`/admin/deliveries?edit=${openId}`)}
      />
    </>
  );
}

export function SupportTicketsSection({ owner }: { owner: Owner }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const query = "customerId" in owner ? { userId: owner.customerId } : { accountId: owner.accountId };
  const { data, isLoading } = useSupportCases({ ...query, limit: 20 });
  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? rows.length;

  return (
    <>
      <Section title={`Support Tickets${total ? ` (${total})` : ""}`} description={total > rows.length ? `Showing the latest ${rows.length}` : undefined} flush>
        <DataTable<SupportCase>
          title=""
          columns={caseColumns}
          data={rows}
          isLoading={isLoading}
          onRowClick={(c) => setOpenId(c.case_id)}
          className={FLUSH_TABLE}
          emptyState={<span className="text-sm text-muted">No support tickets yet.</span>}
        />
      </Section>
      <CaseDetailsSheet open={!!openId} onClose={() => setOpenId(null)} caseId={openId ?? ""} />
    </>
  );
}
