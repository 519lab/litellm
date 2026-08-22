import React, { type UIEvent } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export interface UserOption {
  value: string;
  label: string;
}

export interface UserFilterSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: readonly UserOption[];
  onSearchChange: (search: string) => void;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

const LOAD_MORE_SCROLL_RATIO = 0.8;

export const USER_FILTER_LABEL = "Filter by user";

export const UserFilterSelect: React.FC<UserFilterSelectProps> = ({
  value,
  onChange,
  options,
  onSearchChange,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) => {
  const selected = options.find((option) => option.value === value) ?? null;

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if ((scrollTop + clientHeight) / scrollHeight < LOAD_MORE_SCROLL_RATIO) return;
    if (!hasNextPage || isFetchingNextPage) return;
    onLoadMore();
  };

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(item: UserOption | null) => onChange(item?.value ?? null)}
      isItemEqualToValue={(a: UserOption, b: UserOption) => a.value === b.value}
      itemToStringLabel={(item: UserOption) => item.label}
      onInputValueChange={(text, details) => {
        if (details.reason !== "input-change" && text !== "") return;
        onSearchChange(text);
      }}
      filter={null}
    >
      <ComboboxInput
        placeholder={USER_FILTER_LABEL}
        aria-label={USER_FILTER_LABEL}
        showClear={selected !== null}
        className="w-72"
      />
      <ComboboxContent>
        <ComboboxEmpty>{isLoading ? "Loading users…" : "No users found"}</ComboboxEmpty>
        <ComboboxList onScroll={handleListScroll}>
          {(item: UserOption) => (
            <ComboboxItem key={item.value} value={item}>
              <span className="truncate">{item.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
        {isFetchingNextPage && (
          <div role="status" className="px-2 py-1.5 text-center text-xs text-muted-foreground">
            Loading more users…
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
};
