"use client";

import { useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { CompanyOptionSelect } from "@/components/ui/company-option-select";
import { OTHER_CITY, PROVINCES, citiesForProvince } from "@/lib/corporate-options";

// Province dropdown plus a City dropdown filtered to that province. Picking
// "Other" (or an existing city that isn't in the list) shows a text box so any
// city can still be entered.
export function ProvinceCitySelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
  provinceLabel = "Province",
  cityLabel = "City",
  labelClassName = "text-sm font-medium text-foreground",
  wrapperClassName = "grid grid-cols-1 gap-4 sm:grid-cols-2",
  error,
}: {
  province: string;
  city: string;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  provinceLabel?: string;
  cityLabel?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: { province?: string; city?: string };
}) {
  const cities = citiesForProvince(province);
  const [pickedOther, setPickedOther] = useState(false);
  const isCustom = pickedOther || (city !== "" && !cities.includes(city));

  return (
    <div className={wrapperClassName}>
      <div className="space-y-1">
        <label className={labelClassName}>{provinceLabel}</label>
        <CompanyOptionSelect
          value={province}
          onChange={(p) => {
            onProvinceChange(p);
            onCityChange("");
            setPickedOther(false);
          }}
          options={PROVINCES}
          placeholder="Select province"
        />
        {error?.province && <p className="text-xs text-danger">{error.province}</p>}
      </div>

      <div className="space-y-1">
        <label className={labelClassName}>{cityLabel}</label>
        <SearchableSelect
          value={isCustom ? OTHER_CITY : city}
          onValueChange={(c) => {
            if (c === OTHER_CITY) {
              setPickedOther(true);
              onCityChange("");
            } else {
              setPickedOther(false);
              onCityChange(c);
            }
          }}
          options={[...cities, OTHER_CITY].map((c) => ({ value: c, label: c }))}
          placeholder={province ? "Select city" : "Select province first"}
          disabled={!province}
        />
        {isCustom && (
          <Input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Enter city"
            className="mt-2 rounded-lg"
          />
        )}
        {error?.city && <p className="text-xs text-danger">{error.city}</p>}
      </div>
    </div>
  );
}
