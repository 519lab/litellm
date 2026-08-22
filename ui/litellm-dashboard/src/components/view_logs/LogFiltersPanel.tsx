import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "@tanstack/react-pacer/debouncer";
import { DEBOUNCE_WAIT_MS } from "@/utils/debounceConstants";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterOption } from "../molecules/filter";
import type { LogFilterState } from "./log_filter_logic";
import { LOG_FILTERS_PANEL_ID } from "./LogsToolbar";

interface Choice {
  readonly label: string;
  readonly value: string;
}

interface FieldProps {
  option: FilterOption;
  value: string;
  onChange: (value: string) => void;
  allValues: LogFilterState;
}

function SearchField({ option, value, onChange }: FieldProps) {
  const [query, setQuery] = useState("");
  const setQueryDebounced = useDebouncedCallback(setQuery, { wait: DEBOUNCE_WAIT_MS });
  const { data: items = [] } = useQuery<Choice[]>({
    queryKey: ["logFilterSearch", option.name, query],
    queryFn: () => option.searchFn?.(query) ?? Promise.resolve([]),
    placeholderData: keepPreviousData,
  });
  const selected = items.find((item) => item.value === value) ?? (value ? { label: value, value } : null);

  return (
    <Combobox<Choice>
      items={items}
      value={selected}
      onValueChange={(item) => onChange(item?.value ?? "")}
      isItemEqualToValue={(a, b) => a.value === b.value}
      itemToStringLabel={(item) => item.label}
      filter={null}
      onInputValueChange={(text) => setQueryDebounced(text)}
    >
      <ComboboxInput id={option.name} placeholder={`Search ${option.label ?? option.name}…`} showClear={value !== ""} />
      <ComboboxContent>
        <ComboboxEmpty>No results</ComboboxEmpty>
        <ComboboxList>
          {(item: Choice) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function FilterField({ option, value, onChange, allValues }: FieldProps) {
  if (option.customComponent) {
    const Custom = option.customComponent;
    return (
      <Custom
        value={value || undefined}
        onChange={(next) => onChange(next ?? "")}
        placeholder={`Select ${option.label ?? option.name}…`}
        allFilters={allValues}
      />
    );
  }
  if (option.options) {
    return (
      <Select value={value || null} onValueChange={(next) => onChange(next ?? "")}>
        <SelectTrigger id={option.name} size="sm" className="w-full">
          <SelectValue placeholder={`Select ${option.label ?? option.name}…`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Any</SelectItem>
          {option.options.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (option.isSearchable && option.searchFn) {
    return <SearchField option={option} value={value} onChange={onChange} allValues={allValues} />;
  }
  return (
    <Input
      id={option.name}
      className="h-8 text-sm"
      placeholder={`Enter ${option.label ?? option.name}…`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface LogFiltersPanelProps {
  options: readonly FilterOption[];
  values: LogFilterState;
  onChange: (name: string, value: string) => void;
}

export function LogFiltersPanel({ options, values, onChange }: LogFiltersPanelProps) {
  return (
    <div
      id={LOG_FILTERS_PANEL_ID}
      className="grid grid-cols-1 gap-x-6 gap-y-3 border-b border-border bg-muted/30 px-3 py-3 md:grid-cols-3"
    >
      {options.map((option) => (
        <div key={option.name} className="flex flex-col gap-1.5">
          <Label htmlFor={option.name} className="text-xs text-muted-foreground">
            {option.label ?? option.name}
          </Label>
          <FilterField
            option={option}
            value={values[option.name as keyof LogFilterState] ?? ""}
            onChange={(value) => onChange(option.name, value)}
            allValues={values}
          />
        </div>
      ))}
    </div>
  );
}
