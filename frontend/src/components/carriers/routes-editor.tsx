"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { NORTH_AMERICA_CITY_SEARCH, ROUTE_REGION_OPTIONS, matchRegion } from "@/lib/carrier-options";
import type { AddressSuggestion } from "@/lib/utils/geocode";

export type RouteDraft = {
  key: string; // client-only row key
  province: string;
  originCity: string;
  destinationCity: string;
  crossBorder: boolean;
  // Countries of cities picked from suggestions (not saved) — used to set
  // Cross-border automatically when the two ends are in different countries.
  originCountry?: string;
  destinationCountry?: string;
};

export function newRouteDraft(): RouteDraft {
  return { key: crypto.randomUUID(), province: "", originCity: "", destinationCity: "", crossBorder: false };
}

// One row per operating lane (e.g. Toronto → Ottawa); "Add Another Route"
// appends a row. Each row is saved as its own route under the carrier.
// Origin / destination suggest cities and towns across Canada and the US.
export function RoutesEditor({ routes, onChange }: { routes: RouteDraft[]; onChange: (next: RouteDraft[]) => void }) {
  function update(key: string, patch: Partial<RouteDraft>) {
    onChange(
      routes.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (next.originCountry && next.destinationCountry && (patch.originCountry || patch.destinationCountry)) {
          next.crossBorder = next.originCountry !== next.destinationCountry;
        }
        return next;
      }),
    );
  }

  function pickCity(route: RouteDraft, end: "origin" | "destination", s: AddressSuggestion) {
    const region = matchRegion(s.context?.region);
    update(route.key, {
      ...(end === "origin"
        ? { originCity: s.text ?? s.placeName, originCountry: s.context?.country }
        : { destinationCity: s.text ?? s.placeName, destinationCountry: s.context?.country }),
      // Fill Province / State from the origin (or whichever end is picked first).
      ...(!route.province && region ? { province: region } : {}),
    });
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
              <Label htmlFor={`origin-${route.key}`}>Origin city</Label>
              <AddressAutocomplete
                id={`origin-${route.key}`}
                value={route.originCity}
                onChange={(v) => update(route.key, { originCity: v, originCountry: undefined })}
                onSelect={(s) => pickCity(route, "origin", s)}
                valueOnSelect={(s) => s.text ?? s.placeName}
                searchOptions={NORTH_AMERICA_CITY_SEARCH}
                placeholder="Where the shipment starts"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`dest-${route.key}`}>Destination city</Label>
              <AddressAutocomplete
                id={`dest-${route.key}`}
                value={route.destinationCity}
                onChange={(v) => update(route.key, { destinationCity: v, destinationCountry: undefined })}
                onSelect={(s) => pickCity(route, "destination", s)}
                valueOnSelect={(s) => s.text ?? s.placeName}
                searchOptions={NORTH_AMERICA_CITY_SEARCH}
                placeholder="Where the shipment ends"
                className="rounded-lg"
              />
            </div>
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
