"use client";

import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Dropdown with a checkbox per option; stays open while ticking several.
// `open` / `onOpenChange` are optional — pass them to open it programmatically.
export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  label,
  open,
  onOpenChange,
  className,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const count = options.filter((o) => selected.includes(o)).length;

  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option]);
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-card-border bg-card px-3 text-left text-sm transition-colors hover:border-primary/30 focus:border-primary focus:outline-none",
          className,
        )}
      >
        <span className={count ? "text-foreground" : "text-muted"}>
          {count ? `${count} selected` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-(--radix-dropdown-menu-trigger-width) min-w-64 overflow-y-auto rounded-xl border border-card-border bg-card shadow-lg"
      >
        {label && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-muted">{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            // Keep the menu open so several options can be ticked in a row.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(option)}
            className="cursor-pointer rounded-lg"
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
