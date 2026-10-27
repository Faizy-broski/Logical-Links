"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  ADDRESS_REGION_OPTIONS,
  NORTH_AMERICA_ADDRESS_SEARCH,
  NORTH_AMERICA_CITY_SEARCH,
  matchRegion,
} from "@/lib/carrier-options";

export type NorthAmericaAddress = {
  addressLine1: string;
  addressCity: string;
  addressProvince: string;
  addressPostcode: string;
};

// Business address for Canada or the US. Picking a suggested street address
// fills in city, province/state and postal/ZIP code; picking a suggested city
// fills in its province/state. Every field can still be typed or changed.
export function NorthAmericaAddressFields({
  value,
  onChange,
}: {
  value: NorthAmericaAddress;
  onChange: (patch: Partial<NorthAmericaAddress>) => void;
}) {
  // Keep a stored region that isn't in the list (older free text) selectable.
  const regionOptions =
    value.addressProvince && !ADDRESS_REGION_OPTIONS.some((o) => o.value === value.addressProvince)
      ? [{ value: value.addressProvince, label: value.addressProvince }, ...ADDRESS_REGION_OPTIONS]
      : ADDRESS_REGION_OPTIONS;

  return (
    <>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="na-street">Street address</Label>
        <AddressAutocomplete
          id="na-street"
          value={value.addressLine1}
          onChange={(v) => onChange({ addressLine1: v })}
          searchOptions={NORTH_AMERICA_ADDRESS_SEARCH}
          valueOnSelect={(s) => s.street ?? s.placeName}
          onSelect={(s) =>
            onChange({
              addressCity: s.context?.city ?? value.addressCity,
              addressProvince: matchRegion(s.context?.region) ?? value.addressProvince,
              addressPostcode: s.context?.postcode ?? value.addressPostcode,
            })
          }
          placeholder="Start typing a Canadian or US address"
          className="rounded-lg"
        />
        <p className="text-xs text-muted">Pick a suggestion to fill in the city, province/state and postal code.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Province / State</Label>
        <SearchableSelect
          value={value.addressProvince}
          onValueChange={(v) => onChange({ addressProvince: v })}
          options={regionOptions}
          placeholder="Select province or state"
          searchPlaceholder="Search…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="na-city">City / town</Label>
        <AddressAutocomplete
          id="na-city"
          value={value.addressCity}
          onChange={(v) => onChange({ addressCity: v })}
          searchOptions={NORTH_AMERICA_CITY_SEARCH}
          valueOnSelect={(s) => s.text ?? s.placeName}
          onSelect={(s) => {
            const region = matchRegion(s.context?.region);
            if (region) onChange({ addressProvince: region });
          }}
          placeholder="Start typing a city"
          className="rounded-lg"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="na-postcode">Postal / ZIP code</Label>
        <Input
          id="na-postcode"
          value={value.addressPostcode}
          onChange={(e) => onChange({ addressPostcode: e.target.value })}
          className="rounded-lg"
        />
      </div>
    </>
  );
}
