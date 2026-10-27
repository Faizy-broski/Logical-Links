"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CORPORATE_PIPELINE_STATUSES,
  CORPORATE_PIPELINE_STATUS_META,
  CORPORATE_PORTAL_ACCESS_STATUSES,
  type CorporatePipelineStatus,
} from "@/types/api.types";

export function PipelineStatusSelect({
  value,
  onChange,
  loading = false,
  disabled = false,
}: {
  value: CorporatePipelineStatus;
  onChange: (next: CorporatePipelineStatus) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || loading}
        aria-label={`Pipeline stage: ${CORPORATE_PIPELINE_STATUS_META[value].label}`}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-card-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={`h-2 w-2 rounded-full ${CORPORATE_PIPELINE_STATUS_META[value].dot}`} />
        {CORPORATE_PIPELINE_STATUS_META[value].label}
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-muted" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 rounded-xl border border-card-border bg-card shadow-lg">
        <DropdownMenuLabel className="text-xs font-semibold text-muted">Pipeline stage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CORPORATE_PIPELINE_STATUSES.map((s) => {
          const meta = CORPORATE_PIPELINE_STATUS_META[s];
          const grantsAccess = CORPORATE_PORTAL_ACCESS_STATUSES.includes(s);
          return (
            <DropdownMenuItem
              key={s}
              className="cursor-pointer items-start gap-2 rounded-lg py-2"
              onClick={() => s !== value && onChange(s)}
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {meta.label}
                  {grantsAccess && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-green-700">· portal access</span>
                  )}
                </span>
                <span className="block text-xs text-muted">{meta.description}</span>
              </span>
              {s === value && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
