import { INVITATION_STATUS_META, type InvitationStatus } from "@/types/api.types";

/** "Account Created – Invitation Sent / Not Sent / Expired" (or "Account Activated"). */
export function InvitationStatusBadge({
  status,
  className = "",
}: {
  status: InvitationStatus;
  className?: string;
}) {
  const meta = INVITATION_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
