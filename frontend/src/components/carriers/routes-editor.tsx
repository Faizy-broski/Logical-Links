"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ROUTE_REGION_OPTIONS } from "@/lib/carrier-options";

export type RouteDraft = {
  key: string; // client-only row key
  province: string;
  originCity: string;
  destinationCity: string;
  crossBorder: boolean;
};

export function newRouteDraft(): RouteDraft {
  return { key: crypto.randomUUID(), province: "", originCity: "", destinationCity: "", crossBorder: false };
}

// One row per operating lane (e.g. Toronto → Ottawa); "Add Another Route"
// appends a row. Each row is saved as its own route under the carrier.
export function RoutesEditor({ routes, onChange }: { routes: RouteDraft[]; onChange: (next: RouteDraft[]) => void }) {
  function update(key: string, patch: Partial<RouteDraft>) {
    onChange(routes.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-3">
      {routes.length === 0 && (
        <p className="rounded-xl border border-dashed border-card-border px-4 py-3 text-sm text-muted">No routes yet.</p>
      )}

      {routes.map((route, i) => (
        <div key={route.key} className="rounded-xl border border-card-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Route {i + 1}</p>
            <button
              type="button"
              onClick={() => onChange(routes.filter((r) => r.key !== route.key))}
              className="flex items-center gap-1 text-xs font-medium text-muted hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Province / State</Label>
              <SearchableSelect
                value={route.province}
                onValueChange={(v) => update(route.key, { province: v })}
                options={ROUTE_REGION_OPTIONS}
                placeholder="Select province or state"
                searchPlaceholder="Search…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cross-border</Label>
              <div className="flex h-9 overflow-hidden rounded-lg border border-card-border text-sm">
                {[false, true].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={route.crossBorder === value}
                    onClick={() => update(route.key, { crossBorder: value })}
                    className={`flex-1 font-medium transition-colors ${
                      route.crossBorder === value ? "bg-primary text-sidebar" : "bg-card text-muted hover:text-foreground"
                    }`}
                  >
                    {value ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`origin-${route.key}`}>Origin city</Label>
              <Input id={`origin-${route.key}`} value={route.originCity} onChange={(e) => update(route.key, { originCity: e.target.value })} placeholder="Where the shipment starts" className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`dest-${route.key}`}>Destination city</Label>
              <Input id={`dest-${route.key}`} value={route.destinationCity} onChange={(e) => update(route.key, { destinationCity: e.target.value })} placeholder="Where the shipment ends" className="rounded-lg" />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...routes, newRouteDraft()])} className="rounded-lg">
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {routes.length === 0 ? "Add Route" : "Add Another Route"}
      </Button>
    </div>
  );
}
