"use client";

import { SearchableSelect } from "@/components/ui/searchable-select";

// Searchable dropdown over a plain list of strings. A current value that isn't
// in the list (e.g. older free-text data) is kept as an extra option so editing
// a record never silently blanks it.
export function CompanyOptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const list = value && !options.includes(value) ? [value, ...options] : [...options];
  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      options={list.map((o) => ({ value: o, label: o }))}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
