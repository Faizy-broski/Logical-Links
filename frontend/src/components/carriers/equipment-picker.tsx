"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_NAMES,
  EQUIPMENT_OTHER,
  equipmentCategory,
  type EquipmentCategory,
} from "@/lib/carrier-options";

// Category first, then that category's equipment in a second dropdown that
// opens as soon as the category is picked. Selections from every category are
// kept and shown as removable chips, grouped by category.
export function EquipmentPicker({
  selected,
  onChange,
  other,
  onOtherChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  other: string;
  onOtherChange: (value: string) => void;
}) {
  const [category, setCategory] = useState<EquipmentCategory | "">("");
  const [itemsOpen, setItemsOpen] = useState(false);

  const grouped = EQUIPMENT_CATEGORY_NAMES
    .map((c) => ({ category: c, items: selected.filter((s) => equipmentCategory(s) === c) }))
    .filter((g) => g.items.length > 0);
  const legacy = selected.filter((s) => !equipmentCategory(s));

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Equipment category</Label>
          <SearchableSelect
            value={category}
            onValueChange={(c) => {
              setCategory(c as EquipmentCategory);
              setItemsOpen(true);
            }}
            options={EQUIPMENT_CATEGORY_NAMES.map((c) => ({ value: c, label: c }))}
            placeholder="Select a category"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Equipment / truck types</Label>
          {category ? (
            <MultiSelectDropdown
              key={category}
              options={EQUIPMENT_CATEGORIES[category]}
              selected={selected}
              onChange={onChange}
              label={category}
              placeholder="Select equipment"
              open={itemsOpen}
              onOpenChange={setItemsOpen}
            />
          ) : (
            <div className="flex h-9 items-center rounded-lg border border-dashed border-card-border px-3 text-sm text-muted">
              Select a category first
            </div>
          )}
        </div>
      </div>

      {selected.includes(EQUIPMENT_OTHER) && (
        <div className="space-y-1.5">
          <Label htmlFor="equipment-other">Other equipment (specify)</Label>
          <Input id="equipment-other" value={other} onChange={(e) => onOtherChange(e.target.value)} placeholder="Describe the equipment" className="rounded-lg" />
        </div>
      )}

      {(grouped.length > 0 || legacy.length > 0) && (
        <div className="space-y-2 rounded-xl border border-card-border bg-background p-3">
          {grouped.map((g) => (
            <div key={g.category}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.category}</p>
              <ChipList items={g.items} onRemove={(i) => onChange(selected.filter((s) => s !== i))} />
            </div>
          ))}
          {legacy.length > 0 && (
            <ChipList items={legacy} onRemove={(i) => onChange(selected.filter((s) => s !== i))} />
          )}
        </div>
      )}
    </div>
  );
}

function ChipList({ items, onRemove }: { items: string[]; onRemove: (item: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary">
          {item}
          <button type="button" onClick={() => onRemove(item)} aria-label={`Remove ${item}`} className="rounded-full p-0.5 hover:bg-primary/15">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
