import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { ChevronRight } from "lucide-react";
import React from "react";

export interface CostBreakdown {
  input_cost?: number;
  cache_read_cost?: number;
  cache_creation_cost?: number;
  output_cost?: number;
  total_cost?: number;
  tool_usage_cost?: number;
  additional_costs?: Record<string, number>;
  original_cost?: number;
  discount_percent?: number;
  discount_amount?: number;
  margin_percent?: number;
  margin_fixed_amount?: number;
  margin_total_amount?: number;
}

interface CostBreakdownViewerProps {
  costBreakdown: CostBreakdown | null | undefined;
  totalSpend: number;
  promptTokens?: number;
  completionTokens?: number;
  cacheHit?: string;
  rawInputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

interface CostLine {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
  readonly emphasis?: boolean;
}

const formatCost = (cost: number | undefined): string =>
  cost === undefined || cost === null ? "-" : `$${formatNumberWithCommas(cost, 8)}`;

const formatPercent = (percent: number | undefined): string =>
  percent === undefined || percent === null ? "-" : `${(percent * 100).toFixed(2)}%`;

const nonZero = (value: number | undefined): value is number => value !== undefined && value !== 0;

const tokens = (count: number | undefined, suffix = "tokens"): string | undefined =>
  count === undefined || count === null ? undefined : `(${count.toLocaleString()} ${suffix})`;

const line = (label: string, value: string, note?: string, emphasis?: boolean): CostLine => ({
  label,
  value,
  note,
  emphasis,
});

const tokenLines = (
  p: CostBreakdownViewerProps,
  isCached: boolean,
  inputCost: number | undefined,
  outputCost: number | undefined,
): readonly CostLine[] => {
  const cb = p.costBreakdown;
  const hasCacheBreakdown = cb?.cache_read_cost !== undefined || cb?.cache_creation_cost !== undefined;
  const inputLines = hasCacheBreakdown
    ? [
        line(
          "Input Cost",
          formatCost(isCached ? 0 : (inputCost ?? 0) - (cb?.cache_read_cost ?? 0) - (cb?.cache_creation_cost ?? 0)),
          tokens(p.rawInputTokens),
        ),
        ...((cb?.cache_read_cost ?? 0) > 0
          ? [line("Cache Read Cost", formatCost(isCached ? 0 : cb?.cache_read_cost), tokens(p.cacheReadTokens))]
          : []),
        ...((cb?.cache_creation_cost ?? 0) > 0
          ? [
              line(
                "Cache Write Cost",
                formatCost(isCached ? 0 : cb?.cache_creation_cost),
                tokens(p.cacheCreationTokens),
              ),
            ]
          : []),
      ]
    : [line("Input Cost", formatCost(inputCost), tokens(p.promptTokens, "prompt tokens"))];
  const extra = Object.entries(cb?.additional_costs ?? {})
    .filter(([, value]) => value != null && value !== 0)
    .map(([key, value]) => line(key, formatCost(value)));
  return [
    ...inputLines,
    line("Output Cost", formatCost(outputCost), tokens(p.completionTokens, "completion tokens")),
    ...(nonZero(cb?.tool_usage_cost) && cb.tool_usage_cost > 0
      ? [line("Tool Usage Cost", formatCost(cb.tool_usage_cost))]
      : []),
    ...extra,
  ];
};

const discountLines = (cb: CostBreakdown): readonly CostLine[] => {
  if (nonZero(cb.discount_percent)) {
    return [line(`Discount (${formatPercent(cb.discount_percent)})`, `-${formatCost(cb.discount_amount)}`)];
  }
  if (cb.discount_amount !== undefined) return [line("Discount Amount", `-${formatCost(cb.discount_amount)}`)];
  return [];
};

const adjustmentLines = (cb: CostBreakdown | null | undefined): readonly CostLine[] => {
  if (!cb) return [];
  const discount = discountLines(cb);
  const margin = [
    ...(nonZero(cb.margin_percent)
      ? [
          line(
            `Margin (${formatPercent(cb.margin_percent)})`,
            `+${formatCost((cb.margin_total_amount || 0) - (cb.margin_fixed_amount || 0))}`,
          ),
        ]
      : []),
    ...(nonZero(cb.margin_fixed_amount) ? [line("Margin", `+${formatCost(cb.margin_fixed_amount)}`)] : []),
  ];
  return [...discount, ...margin];
};

const Lines: React.FC<{ lines: readonly CostLine[] }> = ({ lines }) => (
  <dl className="grid max-w-2xl grid-cols-[minmax(10rem,1fr)_2fr] gap-y-1.5 text-sm">
    {lines.map((l) => (
      <React.Fragment key={l.label}>
        <dt className={l.emphasis ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}>
          {l.label}:
        </dt>
        <dd className={l.emphasis ? "font-semibold tabular-nums text-foreground" : "tabular-nums text-foreground"}>
          {l.value}
          {l.note && <span className="ml-1 font-normal text-muted-foreground">{l.note}</span>}
        </dd>
      </React.Fragment>
    ))}
  </dl>
);

export const CostBreakdownViewer: React.FC<CostBreakdownViewerProps> = (props) => {
  const { costBreakdown, totalSpend, promptTokens, completionTokens, cacheHit } = props;
  const isCached = cacheHit?.toLowerCase() === "true";
  const hasTokenCounts = promptTokens !== undefined || completionTokens !== undefined;
  const hasCostBreakdown = costBreakdown?.input_cost !== undefined || costBreakdown?.output_cost !== undefined;
  const adjustments = adjustmentLines(costBreakdown);
  const hasAdditionalCosts = Object.values(costBreakdown?.additional_costs ?? {}).some((v) => v != null && v !== 0);
  if (!hasCostBreakdown && !hasTokenCounts && !hasAdditionalCosts && adjustments.length === 0) return null;

  const inputCost = isCached ? 0 : costBreakdown?.input_cost;
  const outputCost = isCached ? 0 : costBreakdown?.output_cost;
  const originalCost = isCached ? 0 : costBreakdown?.original_cost;
  const totalCost = isCached ? 0 : costBreakdown?.total_cost ?? totalSpend;
  const cachedSuffix = isCached ? " (Cached)" : "";

  return (
    <Collapsible className="mb-6 w-full overflow-hidden rounded-lg border border-border bg-card">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90" />
        <h3 className="flex-1 text-base font-medium text-foreground">Cost Breakdown</h3>
        <span className="text-sm text-muted-foreground">Total:</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatCost(totalSpend)}
          {cachedSuffix}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t border-border px-4 py-4">
        <Lines lines={tokenLines(props, isCached, inputCost, outputCost)} />
        {!isCached && (
          <div className="border-t border-border pt-2">
            <Lines lines={[line("Original LLM Cost", formatCost(originalCost), undefined, true)]} />
          </div>
        )}
        {adjustments.length > 0 && (
          <div className="pt-2">
            <Lines lines={adjustments} />
          </div>
        )}
        <div className="border-t border-border pt-3">
          <Lines lines={[line("Final Calculated Cost", `${formatCost(totalCost)}${cachedSuffix}`, undefined, true)]} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CostBreakdownViewer;
