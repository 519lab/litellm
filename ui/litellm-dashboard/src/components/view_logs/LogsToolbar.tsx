import { CalendarDays, ChevronLeft, ChevronRight, Columns3, Filter, RefreshCw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cva.config";
import { QUICK_SELECT_OPTIONS } from "./constants";
import type { PaginatedResponse } from "./log_filter_logic";
import { customTimeRange, quickTimeRange, timeRangeLabel, toCustomTimeRange, type TimeRange } from "./timeRange";

export const LOG_FILTERS_PANEL_ID = "logs-filters-panel";

export interface ColumnToggle {
  readonly id: string;
  readonly label: string;
  readonly visible: boolean;
}

interface LogsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  activeFilterCount: number;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onResetFilters: () => void;
  isLiveTail: boolean;
  onIsLiveTailChange: (value: boolean) => void;
  isFetching: boolean;
  onRefresh: () => void;
  columns: readonly ColumnToggle[];
  onColumnVisibleChange: (columnId: string, visible: boolean) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  isLoading: boolean;
  results: PaginatedResponse;
}

export function LogsToolbar({
  searchTerm,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  activeFilterCount,
  filtersOpen,
  onFiltersOpenChange,
  onResetFilters,
  isLiveTail,
  onIsLiveTailChange,
  isFetching,
  onRefresh,
  columns,
  onColumnVisibleChange,
  currentPage,
  onPageChange,
  pageSize,
  isLoading,
  results,
}: LogsToolbarProps) {
  const totalPages = Math.max(results.total_pages, 1);
  const capSuffix = results.total_is_capped ? "+" : "";
  const firstRow = results.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, results.total);
  const isPolling = isLiveTail && currentPage === 1;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <div className="relative w-56">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search by Request ID"
          placeholder="Search by Request ID"
          className="h-8 pl-8 text-sm"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <CalendarDays aria-hidden="true" />
          {timeRangeLabel(timeRange)}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {QUICK_SELECT_OPTIONS.map((option) => (
            <DropdownMenuItem key={option.label} onClick={() => onTimeRangeChange(quickTimeRange(option))}>
              {option.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onTimeRangeChange(toCustomTimeRange(timeRange))}>
            Custom Range
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {timeRange.mode === "custom" && (
        <div className="flex items-center gap-1.5">
          <Input
            type="datetime-local"
            aria-label="Start time"
            className="h-8 w-auto text-sm"
            value={timeRange.startTime}
            onChange={(event) => onTimeRangeChange(customTimeRange(event.target.value, timeRange.endTime))}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="datetime-local"
            aria-label="End time"
            className="h-8 w-auto text-sm"
            value={timeRange.endTime}
            onChange={(event) => onTimeRangeChange(customTimeRange(timeRange.startTime, event.target.value))}
          />
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        aria-expanded={filtersOpen}
        aria-controls={LOG_FILTERS_PANEL_ID}
        onClick={() => onFiltersOpenChange(!filtersOpen)}
      >
        <Filter aria-hidden="true" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[11px]" aria-label={`${activeFilterCount} active`}>
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          <X aria-hidden="true" />
          Reset
        </Button>
      )}

      <label className="flex items-center gap-2 pl-1 text-sm text-foreground">
        <Switch
          size="sm"
          checked={isLiveTail}
          aria-label="Live tail, auto-refresh every 15 seconds on page 1"
          onCheckedChange={(checked) => onIsLiveTailChange(checked)}
        />
        <span
          data-testid="live-indicator"
          aria-hidden="true"
          className={cn("size-2 rounded-full", isPolling ? "bg-primary animate-pulse" : "bg-muted-foreground/40")}
        />
        Live
      </label>

      <Button variant="ghost" size="icon-sm" aria-label="Refresh" onClick={onRefresh} disabled={isFetching}>
        <RefreshCw aria-hidden="true" className={cn(isFetching && "animate-spin")} />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Columns" />}>
          <Columns3 aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.visible}
              closeOnClick={false}
              onCheckedChange={(checked) => onColumnVisibleChange(column.id, checked)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
        <span
          className="whitespace-nowrap"
          title={
            results.total_is_capped
              ? `Showing the first ${results.total.toLocaleString()} results. Narrow the range or add filters to see more.`
              : undefined
          }
        >
          {isLoading ? "Loading…" : `${firstRow}–${lastRow} of ${results.total.toLocaleString()}${capSuffix}`}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={isLoading || currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="whitespace-nowrap">
          Page {currentPage} of {totalPages}
          {capSuffix}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={isLoading || currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
