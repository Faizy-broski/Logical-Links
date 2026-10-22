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
import { cn } from "@/lib/utils";
import { CARRIER_STATUSES, CARRIER_STATUS_META, type CarrierStatus } from "@/types/api.types";

export function CarrierStatusBadge({ status, className }: { status: CarrierStatus; className?: string }) {
  const meta = CARRIER_STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", meta.badge, className)}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// Same design as the corporate customer PipelineStatusSelect: badge trigger,
// each stage listed with its short description.
export function CarrierStatusSelect({
  value,
  onChange,
  loading = false,
  disabled = false,
  className,
}: {
  value: CarrierStatus;
  onChange: (next: CarrierStatus) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <CarrierStatusBadge status={value} />
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-muted" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 rounded-xl border border-card-border bg-card shadow-lg">
        <DropdownMenuLabel className="text-xs font-semibold text-muted">Carrier pipeline</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CARRIER_STATUSES.map((s) => {
          const meta = CARRIER_STATUS_META[s];
          return (
            <DropdownMenuItem
              key={s}
              className="cursor-pointer items-start gap-2 rounded-lg py-2"
              onClick={() => s !== value && onChange(s)}
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{meta.label}</span>
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
