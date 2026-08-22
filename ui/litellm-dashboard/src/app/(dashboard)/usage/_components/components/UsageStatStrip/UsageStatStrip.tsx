import { ChevronDown, ChevronRight, CircleAlert, Info, RefreshCw } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumberWithCommas } from "@/utils/dataUtils";

export interface UsageTotals {
  spend: number;
  requests: number;
  successfulRequests: number;
  failedRequests: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

const numberOrZero = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export const readUsageTotals = (metadata: Record<string, unknown>): UsageTotals => ({
  spend: numberOrZero(metadata.total_spend),
  requests: numberOrZero(metadata.total_api_requests),
  successfulRequests: numberOrZero(metadata.total_successful_requests),
  failedRequests: numberOrZero(metadata.total_failed_requests),
  tokens: numberOrZero(metadata.total_tokens),
  promptTokens: numberOrZero(metadata.total_prompt_tokens),
  completionTokens: numberOrZero(metadata.total_completion_tokens),
  cacheReadTokens: numberOrZero(metadata.total_cache_read_input_tokens),
  cacheWriteTokens: numberOrZero(metadata.total_cache_creation_input_tokens),
});

export type UsageStatStripStatus = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready" };

export const usageStatStripStatus = (loading: boolean, error: string | null): UsageStatStripStatus => {
  if (loading) return { kind: "loading" };
  if (error !== null) return { kind: "error", message: error };
  return { kind: "ready" };
};

export interface UsageStatStripProps {
  status: UsageStatStripStatus;
  totals: UsageTotals;
  maxBudget: number | null;
  dateRange: { from?: Date; to?: Date };
  onRetry: () => void;
}

export const FAILED_REQUESTS_HELP =
  "Includes requests that failed to route to a provider, tool usage failures, and other request errors where the " +
  "provider cannot be determined.";

const formatRange = ({ from, to }: { from?: Date; to?: Date }): string | null => {
  if (!from || !to) return null;
  const sameYear = from.getFullYear() === to.getFullYear();
  const fromText = from.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const toText = to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fromText} – ${toText}`;
};

const formatCurrency = (value: number): string => `$${formatNumberWithCommas(value, 4)}`;

const STAT_CELL = "flex min-w-36 flex-1 flex-col gap-0.5 px-4 py-2.5";
const STAT_LABEL = "flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground";
const STAT_VALUE = "flex items-center gap-1.5 text-lg font-semibold tabular-nums text-foreground";

interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
}

const Stat: React.FC<StatProps> = ({ label, value }) => (
  <div className={STAT_CELL}>
    <dt className={STAT_LABEL}>{label}</dt>
    <dd className={STAT_VALUE}>{value}</dd>
  </div>
);

const STRIP = "flex flex-wrap divide-x divide-border rounded-lg border border-border bg-background";

const LoadingStrip: React.FC = () => (
  <div className={STRIP} role="status" aria-label="Loading usage summary">
    {Array.from({ length: 6 }, (_, index) => (
      <div key={index} className={STAT_CELL}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-1.5 h-6 w-24" />
      </div>
    ))}
  </div>
);

const ErrorStrip: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className={`${STRIP} items-center justify-between gap-3 px-4 py-2.5`} role="alert">
    <span className="flex items-center gap-2 text-sm text-destructive">
      <CircleAlert className="size-4" aria-hidden="true" />
      Failed to load usage summary: {message}
    </span>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw aria-hidden="true" />
      Retry
    </Button>
  </div>
);

const EmptyStrip: React.FC<{ range: string | null }> = ({ range }) => (
  <div className={`${STRIP} items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground`}>
    <span>No usage in this range</span>
    {range && <span className="tabular-nums">{range}</span>}
  </div>
);

export const UsageStatStrip: React.FC<UsageStatStripProps> = ({ status, totals, maxBudget, dateRange, onRetry }) => {
  const [showTokenBreakdown, setShowTokenBreakdown] = useState(false);
  const range = formatRange(dateRange);

  if (status.kind === "loading") return <LoadingStrip />;
  if (status.kind === "error") return <ErrorStrip message={status.message} onRetry={onRetry} />;
  if (totals.requests === 0 && totals.tokens === 0) return <EmptyStrip range={range} />;

  const hasSpend = totals.spend > 0;
  const averageCost = totals.requests > 0 ? totals.spend / totals.requests : 0;

  return (
    <TooltipProvider>
      <dl aria-label="Usage summary" className={STRIP}>
        {range && <Stat label="Period" value={<span className="text-sm font-medium">{range}</span>} />}
        {hasSpend && <Stat label="Total Spend" value={formatCurrency(totals.spend)} />}
        {hasSpend && (
          <Stat label="Max Budget" value={maxBudget === null ? "No limit" : `${formatCurrency(maxBudget)} limit`} />
        )}
        {hasSpend && <Stat label="Avg Cost / Request" value={formatCurrency(averageCost)} />}
        <Stat label="Total Requests" value={totals.requests.toLocaleString()} />
        <Stat label="Successful Requests" value={totals.successfulRequests.toLocaleString()} />
        <Stat
          label={
            <>
              Failed Requests
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="About failed requests"
                      className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  }
                >
                  <Info className="size-3.5" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>{FAILED_REQUESTS_HELP}</TooltipContent>
              </Tooltip>
            </>
          }
          value={
            <>
              {totals.failedRequests > 0 && (
                <CircleAlert className="size-4 text-muted-foreground" aria-label="Has failures" role="img" />
              )}
              {totals.failedRequests.toLocaleString()}
            </>
          }
        />
        <div className={STAT_CELL}>
          <dt className={STAT_LABEL}>Total Tokens</dt>
          <dd className={STAT_VALUE}>
            <button
              type="button"
              aria-expanded={showTokenBreakdown}
              aria-controls="usage-token-breakdown"
              onClick={() => setShowTokenBreakdown((open) => !open)}
              className="flex items-center gap-1 rounded-sm outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {totals.tokens.toLocaleString()}
              {showTokenBreakdown ? (
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          </dd>
        </div>
        {showTokenBreakdown && (
          <div
            id="usage-token-breakdown"
            className="flex w-full flex-wrap divide-x divide-border border-t border-border"
          >
            <Stat label="Input Tokens" value={totals.promptTokens.toLocaleString()} />
            <Stat label="Output Tokens" value={totals.completionTokens.toLocaleString()} />
            <Stat label="Cache Read Tokens" value={totals.cacheReadTokens.toLocaleString()} />
            <Stat label="Cache Write Tokens" value={totals.cacheWriteTokens.toLocaleString()} />
          </div>
        )}
      </dl>
    </TooltipProvider>
  );
};
