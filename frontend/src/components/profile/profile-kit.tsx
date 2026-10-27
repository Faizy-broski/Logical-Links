"use client";

import Link from "next/link";
import { ChevronLeft, MoreHorizontal, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Building blocks for admin customer profiles (corporate + residential):
// a flat header, one bordered panel per column with hairline-divided
// sections, and plain label/value rows — no stacked cards, icon tiles or pills.

/* ─── Header ──────────────────────────────────────────────────────────────── */

export function ProfileHeader({
  backHref,
  backLabel,
  media,
  title,
  meta,
  actions,
}: {
  backHref: string;
  backLabel: string;
  media?: React.ReactNode;
  title: string;
  /** Short facts shown on one line under the name, separated by dots. */
  meta: React.ReactNode[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-card-border pb-6">
      <Link href={backHref} className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground">
        <ChevronLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {media}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {meta.filter(Boolean).map((m, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-card-border">•</span>}
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ─── Status (dot + text, no pill) ────────────────────────────────────────── */

export function StatusDot({ label, dotClass, className }: { label: string; dotClass: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium text-foreground", className)}>
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

/* ─── Actions ─────────────────────────────────────────────────────────────── */

export function ActionButton({
  icon: Icon,
  children,
  onClick,
  variant = "secondary",
  disabled,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-foreground text-background hover:bg-foreground/85"
          : "border border-card-border bg-card text-foreground hover:bg-foreground/5",
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

export type MoreAction = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

/** Secondary and destructive actions live here instead of a stack of buttons. */
export function MoreActions({ actions }: { actions: MoreAction[] }) {
  if (actions.length === 0) return null;
  const safe = actions.filter((a) => !a.danger);
  const danger = actions.filter((a) => a.danger);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More actions"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-card-border bg-card text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-lg border border-card-border bg-card p-1 shadow-lg">
        {safe.map((a) => (
          <DropdownMenuItem key={a.label} onClick={a.onClick} disabled={a.disabled} className="cursor-pointer gap-2 rounded-md text-[13px]">
            <a.icon className="h-3.5 w-3.5 text-muted" />
            {a.label}
          </DropdownMenuItem>
        ))}
        {safe.length > 0 && danger.length > 0 && <DropdownMenuSeparator />}
        {danger.map((a) => (
          <DropdownMenuItem
            key={a.label}
            onClick={a.onClick}
            disabled={a.disabled}
            className="cursor-pointer gap-2 rounded-md text-[13px] text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <a.icon className="h-3.5 w-3.5" />
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Panels & sections ───────────────────────────────────────────────────── */

/** One bordered surface per column; its sections are split by hairlines. */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("divide-y divide-card-border overflow-hidden rounded-xl border border-card-border bg-card", className)}>
      {children}
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  flush = false,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Remove the content padding (for tables / lists that run edge to edge). */
  flush?: boolean;
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3 px-6 pt-5">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className={flush ? "pt-3" : "px-6 pb-5 pt-3"}>{children}</div>
    </section>
  );
}

/** Small text-style button for section headers ("Edit", "Add note"). */
export function SectionAction({ icon: Icon, children, onClick }: { icon?: LucideIcon; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </button>
  );
}

/* ─── Fields ──────────────────────────────────────────────────────────────── */

export type FieldItem = {
  label: string;
  value?: React.ReactNode;
  href?: string;
  /** Span both columns (long values like addresses). */
  wide?: boolean;
};

function isEmpty(v: React.ReactNode) {
  return v === null || v === undefined || v === "" || v === false;
}

export function Fields({ items, columns = 2 }: { items: FieldItem[]; columns?: 1 | 2 }) {
  return (
    <dl className={cn("grid gap-x-8 gap-y-4", columns === 2 && "sm:grid-cols-2")}>
      {items.map((f) => (
        <div key={f.label} className={cn("min-w-0", f.wide && columns === 2 && "sm:col-span-2")}>
          <dt className="text-xs text-muted">{f.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-foreground">
            {isEmpty(f.value) ? (
              <span className="text-muted-light">—</span>
            ) : f.href ? (
              <a
                href={f.href}
                target={f.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="text-foreground underline decoration-card-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
              >
                {f.value}
              </a>
            ) : (
              f.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ─── Stats strip ─────────────────────────────────────────────────────────── */

export function StatStrip({ stats, loading = false }: { stats: { label: string; value: React.ReactNode }[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 divide-card-border overflow-hidden rounded-xl border border-card-border bg-card sm:grid-cols-4 sm:divide-x">
      {stats.map((s) => (
        <div key={s.label} className="px-5 py-4">
          <p className="text-xs text-muted">{s.label}</p>
          {loading ? (
            <div className="mt-1.5 h-6 w-14 animate-pulse rounded bg-foreground/8" />
          ) : (
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground">{s.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Initials avatar (square, quiet) ─────────────────────────────────────── */

export function Monogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-card-border bg-background text-sm font-semibold tracking-wide text-foreground">
      {initials || "?"}
    </div>
  );
}
