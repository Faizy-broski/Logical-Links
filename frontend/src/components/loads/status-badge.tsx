"use client";
import { LoadStatus } from "@/types/load.types";


type Props = {
  status: LoadStatus;
};

export function StatusBadge({ status }: Props) {
  const styles: Record<LoadStatus, string> = {
    Pending: "bg-warning/10 text-yellow-700 border-warning/25",
    "In Transit": "bg-info/10 text-blue-700 border-info/25",
    Delivered: "bg-success/10 text-green-700 border-success/25",
    Cancelled: "bg-danger/10 text-red-700 border-danger/25",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}