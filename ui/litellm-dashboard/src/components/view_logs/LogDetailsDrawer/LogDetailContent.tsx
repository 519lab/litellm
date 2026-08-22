import { useState } from "react";
import moment from "moment";
import { ChevronDown, CircleAlert } from "lucide-react";
import CopyButton from "@/components/shared/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { LogEntry } from "../columns";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import GuardrailViewer from "../GuardrailViewer/GuardrailViewer";
import EvalViewer from "../EvalViewer/EvalViewer";
import { CostBreakdownViewer } from "../CostBreakdownViewer";
import { ConfigInfoMessage } from "../ConfigInfoMessage";
import { VectorStoreViewer } from "../VectorStoreViewer";
import { TruncatedValue } from "./TruncatedValue";
import { TokenFlow } from "./TokenFlow";
import { JsonViewer } from "./JsonViewer";
import { SegmentedToggle } from "./SegmentedToggle";
import {
  formatData,
  checkHasMessages,
  checkHasResponse,
  normalizeGuardrailEntries,
  calculateTotalMaskedEntities,
  getGuardrailLabel,
  checkHasVectorStoreData,
} from "./utils";
import { ToolsSection } from "../ToolsSection";
import { PrettyMessagesView } from "./PrettyMessagesView";

export interface LogDetailContentProps {
  logEntry: LogEntry;
  isLoadingDetails?: boolean;
  accessToken?: string | null;
}

interface ErrorInformation {
  error_code?: string;
  error_message?: string;
  error_class?: string;
}

type LogMetadata = NonNullable<LogEntry["metadata"]>;

const CARD_CLASS = "mb-6 w-full max-w-full overflow-hidden rounded-lg border border-border bg-card";
const CARD_TITLE_CLASS = "text-base font-medium text-foreground";
const TRIGGER_CLASS =
  "group flex items-center gap-2 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const CHEVRON_CLASS = "size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-180";

export function LogDetailContent({ logEntry, isLoadingDetails = false, accessToken }: LogDetailContentProps) {
  const metadata: LogMetadata = logEntry.metadata || {};
  const hasError = metadata.status === "failure";
  const hasCost = (logEntry.spend ?? 0) > 0;
  const errorInfo: ErrorInformation | null = hasError ? metadata.error_information ?? null : null;

  const hasMessages = checkHasMessages(logEntry.messages);
  const hasResponse = checkHasResponse(logEntry.response);
  const missingData = !hasMessages && !hasResponse && !hasError && !isLoadingDetails;

  const guardrailInfo = metadata.guardrail_information;
  const guardrailEntries = normalizeGuardrailEntries(guardrailInfo);
  const hasGuardrailData = guardrailEntries.length > 0;
  const totalMaskedEntities = calculateTotalMaskedEntities(guardrailEntries);
  const primaryGuardrailLabel = getGuardrailLabel(guardrailEntries);

  const evalInfo = metadata.eval_information;
  const hasEvalData = evalInfo != null;
  const hasVectorStoreData = checkHasVectorStoreData(metadata);

  const getRawRequest = () => formatData(logEntry.proxy_server_request || logEntry.messages);

  const getFormattedResponse = () => {
    if (hasError && errorInfo) {
      return {
        error: {
          message: errorInfo.error_message || "An error occurred",
          type: errorInfo.error_class || "error",
          code: errorInfo.error_code || "unknown",
          param: null,
        },
      };
    }
    return formatData(logEntry.response);
  };

  return (
    <div className="px-6 pt-6">
      {hasError && errorInfo && <ErrorAlert errorInfo={errorInfo} />}

      {logEntry.request_tags && Object.keys(logEntry.request_tags).length > 0 && (
        <TagsSection tags={logEntry.request_tags} />
      )}

      <section className={CARD_CLASS}>
        <h3 className={`border-b border-border px-4 py-2 ${CARD_TITLE_CLASS}`}>Request Details</h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-2">
          <DetailItem label="Model">{logEntry.model}</DetailItem>
          <DetailItem label="Provider">{logEntry.custom_llm_provider || "-"}</DetailItem>
          <DetailItem label="Call Type">{logEntry.call_type}</DetailItem>
          <DetailItem label="Model ID">
            <TruncatedValue value={logEntry.model_id} />
          </DetailItem>
          <DetailItem label="API Base">
            <TruncatedValue value={logEntry.api_base} className="max-w-[200px]" />
          </DetailItem>
          {logEntry.requester_ip_address && <DetailItem label="IP Address">{logEntry.requester_ip_address}</DetailItem>}
          {hasGuardrailData && (
            <DetailItem label="Guardrail">
              <GuardrailLabel label={primaryGuardrailLabel} maskedCount={totalMaskedEntities} />
            </DetailItem>
          )}
        </dl>
      </section>

      <MetricsSection logEntry={logEntry} metadata={metadata} />

      {hasCost && (
        <CostBreakdownViewer
          costBreakdown={metadata.cost_breakdown}
          totalSpend={logEntry.spend ?? 0}
          promptTokens={logEntry.prompt_tokens}
          completionTokens={logEntry.completion_tokens}
          cacheHit={logEntry.cache_hit}
          rawInputTokens={metadata.additional_usage_values?.prompt_tokens_details?.text_tokens}
          cacheReadTokens={metadata.additional_usage_values?.cache_read_input_tokens}
          cacheCreationTokens={metadata.additional_usage_values?.cache_creation_input_tokens}
        />
      )}

      <ToolsSection log={logEntry} />

      {missingData && (
        <div className="mb-6">
          <ConfigInfoMessage show={missingData} />
        </div>
      )}

      {isLoadingDetails ? (
        <div role="status" className={`${CARD_CLASS} flex flex-col items-center gap-2 p-8 text-center`}>
          <UiLoadingSpinner className="size-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading request &amp; response data...</span>
        </div>
      ) : (
        <RequestResponseSection
          hasResponse={hasResponse}
          hasError={hasError}
          getRawRequest={getRawRequest}
          getFormattedResponse={getFormattedResponse}
          logEntry={logEntry}
        />
      )}

      {hasGuardrailData && (
        <div id="guardrail-section">
          <GuardrailViewer
            data={guardrailInfo}
            accessToken={accessToken ?? null}
            logEntry={{
              request_id: logEntry.request_id,
              user: logEntry.user,
              model: logEntry.model,
              startTime: logEntry.startTime,
              metadata: logEntry.metadata,
            }}
          />
        </div>
      )}

      {hasEvalData && <EvalViewer data={evalInfo} />}

      {hasVectorStoreData && <VectorStoreViewer data={metadata.vector_store_request_metadata} />}

      {logEntry.metadata && Object.keys(logEntry.metadata).length > 0 && (
        <MetadataSection metadata={logEntry.metadata} />
      )}
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm text-foreground">{children}</dd>
    </div>
  );
}

function ErrorAlert({ errorInfo }: { errorInfo: ErrorInformation }) {
  return (
    <div role="alert" className="mb-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 text-foreground">
        <div className="font-medium">Request Failed</div>
        {errorInfo.error_code && (
          <div>
            <span className="font-semibold">Error Code:</span> {errorInfo.error_code}
          </div>
        )}
        {errorInfo.error_message && (
          <div className="break-words">
            <span className="font-semibold">Message:</span> {errorInfo.error_message}
          </div>
        )}
      </div>
    </div>
  );
}

function TagsSection({ tags }: { tags: Record<string, unknown> }) {
  return (
    <section className={`${CARD_CLASS} p-4`}>
      <h3 className={`mb-2 ${CARD_TITLE_CLASS}`}>Tags</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(tags).map(([key, value]) => (
          <Badge key={key} variant="outline">
            {key}: {String(value)}
          </Badge>
        ))}
      </div>
    </section>
  );
}

const scrollToGuardrails = () => {
  document.getElementById("guardrail-section")?.scrollIntoView({ behavior: "smooth" });
};

function GuardrailLabel({ label, maskedCount }: { label: string; maskedCount: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={scrollToGuardrails} className="text-primary underline-offset-4 hover:underline">
        {label}
      </button>
      {maskedCount > 0 && <Badge variant="secondary">{maskedCount} masked</Badge>}
    </span>
  );
}

function getUncachedInputTextTokens(metadata: LogMetadata): number | undefined {
  const raw =
    metadata.additional_usage_values?.prompt_tokens_details?.text_tokens ??
    metadata.usage_object?.prompt_tokens_details?.text_tokens;
  if (raw === undefined || raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

const formatRetries = (attempted: number | null | undefined, max: number | null | undefined): React.ReactNode => {
  if (attempted === undefined || attempted === null) return "-";
  if (attempted === 0) return <Badge variant="outline">None</Badge>;
  return max === undefined || max === null ? String(attempted) : `${attempted} / ${max}`;
};

interface Metric {
  readonly label: string;
  readonly value: React.ReactNode;
}

function MetricsSection({ logEntry, metadata }: { logEntry: LogEntry; metadata: LogMetadata }) {
  const completionStartTime = logEntry.completionStartTime;
  const ttftMs =
    completionStartTime && completionStartTime !== logEntry.endTime
      ? new Date(completionStartTime).getTime() - new Date(logEntry.startTime).getTime()
      : null;

  const cacheReadTokens: number = metadata.additional_usage_values?.cache_read_input_tokens ?? 0;
  const cacheCreationTokens: number = metadata.additional_usage_values?.cache_creation_input_tokens ?? 0;
  const hasCacheActivity = !!logEntry.cache_hit || cacheReadTokens > 0;
  const cacheHitValue = String(logEntry.cache_hit ?? "None");
  const cacheHitVariant = cacheHitValue.toLowerCase() === "true" ? "default" : "outline";

  const uncachedInputTokens = getUncachedInputTextTokens(metadata);
  const showAnthropicMessagesInputOutput =
    logEntry.call_type === "anthropic_messages" && uncachedInputTokens !== undefined;

  const retriesValue = formatRetries(metadata.attempted_retries, metadata.max_retries);

  const overheadMs: number | null | undefined = metadata.litellm_overhead_time_ms;

  const metrics: readonly Metric[] = [
    ...(showAnthropicMessagesInputOutput
      ? [
          { label: "Input Tokens", value: formatNumberWithCommas(uncachedInputTokens) },
          { label: "Output Tokens", value: formatNumberWithCommas(logEntry.completion_tokens) },
        ]
      : [
          {
            label: "Tokens",
            value: (
              <TokenFlow
                prompt={logEntry.prompt_tokens}
                completion={logEntry.completion_tokens}
                total={logEntry.total_tokens}
              />
            ),
          },
        ]),
    ...((logEntry.spend ?? 0) > 0 ? [{ label: "Cost", value: `$${formatNumberWithCommas(logEntry.spend, 8)}` }] : []),
    {
      label: "Duration",
      value: `${logEntry.request_duration_ms != null ? (logEntry.request_duration_ms / 1000).toFixed(3) : "-"} s`,
    },
    ...(ttftMs != null && ttftMs > 0
      ? [{ label: "Time to First Token", value: `${(ttftMs / 1000).toFixed(3)} s` }]
      : []),
    ...(hasCacheActivity
      ? [{ label: "Cache Hit", value: <Badge variant={cacheHitVariant}>{cacheHitValue}</Badge> }]
      : []),
    ...(cacheReadTokens > 0 ? [{ label: "Cache Read Tokens", value: formatNumberWithCommas(cacheReadTokens) }] : []),
    ...(cacheCreationTokens > 0
      ? [{ label: "Cache Creation Tokens", value: formatNumberWithCommas(cacheCreationTokens) }]
      : []),
    ...(overheadMs !== undefined && overheadMs !== null
      ? [{ label: "LiteLLM Overhead", value: `${overheadMs.toFixed(2)} ms` }]
      : []),
    { label: "Retries", value: retriesValue },
    { label: "Start Time", value: moment(logEntry.startTime).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") },
    { label: "End Time", value: moment(logEntry.endTime).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") },
  ];

  return (
    <section className={CARD_CLASS}>
      <h3 className={`border-b border-border px-4 py-2 ${CARD_TITLE_CLASS}`}>Metrics</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-2 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{metric.label}</dt>
            <dd className="truncate text-sm tabular-nums text-foreground">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type ViewMode = "pretty" | "json";
type JsonTab = "request" | "response";

const VIEW_MODE_OPTIONS = [
  { value: "pretty", label: "Pretty" },
  { value: "json", label: "JSON" },
] as const;

interface RequestResponseSectionProps {
  hasResponse: boolean;
  hasError: boolean;
  getRawRequest: () => unknown;
  getFormattedResponse: () => unknown;
  logEntry: LogEntry;
}

function RequestResponseSection({
  hasResponse,
  hasError,
  getRawRequest,
  getFormattedResponse,
  logEntry,
}: RequestResponseSectionProps) {
  const [activeTab, setActiveTab] = useState<JsonTab>("request");
  const [viewMode, setViewMode] = useState<ViewMode>("pretty");

  const copyText = JSON.stringify(activeTab === "request" ? getRawRequest() : getFormattedResponse(), null, 2);

  const totalSpend = logEntry.spend ?? 0;
  const promptTokens = logEntry.prompt_tokens || 0;
  const completionTokens = logEntry.completion_tokens || 0;
  const totalTokens = promptTokens + completionTokens;
  const costBreakdown = logEntry.metadata?.cost_breakdown;
  const useCostBreakdown = costBreakdown?.input_cost !== undefined && costBreakdown?.output_cost !== undefined;
  const proportionalCost = (tokens: number) => (totalTokens > 0 ? (totalSpend * tokens) / totalTokens : 0);
  const inputCost = useCostBreakdown ? costBreakdown.input_cost ?? 0 : proportionalCost(promptTokens);
  const outputCost = useCostBreakdown ? costBreakdown.output_cost ?? 0 : proportionalCost(completionTokens);

  return (
    <Collapsible defaultOpen className={CARD_CLASS}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <CollapsibleTrigger className={TRIGGER_CLASS}>
          <ChevronDown aria-hidden className={CHEVRON_CLASS} />
          <h3 className={CARD_TITLE_CLASS}>Request &amp; Response</h3>
        </CollapsibleTrigger>
        <SegmentedToggle label="View mode" options={VIEW_MODE_OPTIONS} value={viewMode} onChange={setViewMode} />
      </div>
      <CollapsibleContent className="border-t border-border px-4 py-3">
        {viewMode === "pretty" ? (
          <PrettyMessagesView
            request={getRawRequest()}
            response={getFormattedResponse()}
            metrics={{
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              input_cost: inputCost,
              output_cost: outputCost,
            }}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as JsonTab)}>
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              <CopyButton value={copyText} label="Copy JSON" />
            </div>
            <TabsContent value="request" className="py-4">
              <JsonViewer data={getRawRequest()} />
            </TabsContent>
            <TabsContent value="response" className="py-4">
              {hasResponse || hasError ? (
                <JsonViewer data={getFormattedResponse()} />
              ) : (
                <div className="p-5 text-center italic text-muted-foreground">Response data not available</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function GuardrailJumpLink({
  guardrailEntries,
}: {
  guardrailEntries: ReturnType<typeof normalizeGuardrailEntries>;
}) {
  const allPassed = guardrailEntries.every((e) => {
    const status = e?.guardrail_status || e?.status;
    return status === "pass" || status === "passed" || status === "success";
  });
  const count = guardrailEntries.length;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={scrollToGuardrails}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          allPassed
            ? "border-border bg-muted text-foreground"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}
      >
        {allPassed ? "✓" : "✗"} {count} guardrail{count !== 1 ? "s" : ""} evaluated
        <span aria-hidden className="text-[11px] opacity-70">
          {"↓"}
        </span>
      </button>
    </div>
  );
}

function MetadataSection({ metadata }: { metadata: LogMetadata }) {
  const json = JSON.stringify(metadata, null, 2);
  return (
    <Collapsible defaultOpen className={CARD_CLASS}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <CollapsibleTrigger className={TRIGGER_CLASS}>
          <ChevronDown aria-hidden className={CHEVRON_CLASS} />
          <h3 className={CARD_TITLE_CLASS}>Metadata</h3>
        </CollapsibleTrigger>
        <CopyButton value={json} label="Copy metadata" />
      </div>
      <CollapsibleContent className="border-t border-border px-4 py-3">
        <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-foreground">
          {json}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
