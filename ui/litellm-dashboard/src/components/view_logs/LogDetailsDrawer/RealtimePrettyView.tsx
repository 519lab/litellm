import { useState } from "react";
import { ChevronDown, MessageSquare, Mic, Settings, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SectionHeader } from "./SectionHeader";

interface RealtimeEvent {
  type: string;
  event_id?: string;
  session?: RealtimeSession;
  response?: RealtimeResponse;
}

interface RealtimeSession {
  id: string;
  model: string;
  voice?: string;
  modalities?: string[];
  temperature?: number;
  tools?: unknown[];
  instructions?: string;
  turn_detection?: { type?: string };
  input_audio_format?: string;
  output_audio_format?: string;
  max_response_output_tokens?: string | number;
}

interface RealtimeUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  input_token_details?: Record<string, unknown>;
  output_token_details?: Record<string, unknown>;
}

interface RealtimeResponse {
  id: string;
  status: string;
  usage?: RealtimeUsage;
  output?: RealtimeOutputItem[];
  modalities?: string[];
  voice?: string;
  conversation_id?: string;
}

interface RealtimeOutputItem {
  id: string;
  role: string;
  type: string;
  status?: string;
  content?: Array<{
    type: string;
    transcript?: string;
    text?: string;
  }>;
}

interface RealtimeMetrics {
  prompt_tokens?: number;
  completion_tokens?: number;
  input_cost?: number;
  output_cost?: number;
}

interface RealtimePrettyViewProps {
  response: any;
  metrics?: RealtimeMetrics;
}

const REALTIME_EVENT_TYPES: ReadonlySet<string> = new Set(["session.created", "session.updated", "response.done"]);

export function isRealtimeResponse(response: unknown): boolean {
  if (typeof response !== "object" || response === null || !("results" in response)) return false;
  const results = response.results;
  if (!Array.isArray(results) || results.length === 0) return false;
  return results.some((r: { type?: string } | null) => REALTIME_EVENT_TYPES.has(r?.type ?? ""));
}

export function RealtimePrettyView({ response, metrics }: RealtimePrettyViewProps) {
  const events: RealtimeEvent[] = response?.results || [];
  const usage: RealtimeUsage | undefined = response?.usage;

  const sessionEvent = events.find((e) => e.type === "session.created" || e.type === "session.updated");
  const responses = events.flatMap((e) => (e.type === "response.done" && e.response ? [e.response] : []));

  return (
    <div>
      {sessionEvent?.session && <SessionCard session={sessionEvent.session} turnCount={responses.length} />}
      {responses.length > 0 && <ConversationCard responses={responses} totalUsage={usage} metrics={metrics} />}
      {!sessionEvent && responses.length === 0 && (
        <div className="rounded-md border border-border p-4 text-[13px] italic text-muted-foreground">
          No recognized realtime events found
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, turnCount }: { session: RealtimeSession; turnCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mb-2 overflow-hidden rounded-md border border-border bg-card"
    >
      <CollapsibleTrigger className="group flex w-full flex-wrap items-center gap-4 bg-muted px-4 py-2.5 text-left outline-none hover:bg-muted/80 focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronDown
          aria-hidden
          className="size-3 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-180"
        />
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings aria-hidden className="size-3.5 text-muted-foreground" />
          Session
        </span>
        <span className="text-xs text-muted-foreground">{session.model}</span>
        {turnCount > 0 && (
          <Badge variant="secondary">
            {turnCount} {turnCount === 1 ? "turn" : "turns"}
          </Badge>
        )}
        {session.voice && (
          <Badge variant="outline">
            <Volume2 aria-hidden />
            {session.voice}
          </Badge>
        )}
        {session.modalities && (
          <span className="flex gap-1">
            {session.modalities.map((m) => (
              <Badge key={m} variant="outline">
                {m === "audio" ? <Mic aria-hidden /> : <MessageSquare aria-hidden />}
                {m}
              </Badge>
            ))}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
          <ConfigRow label="Model" value={session.model} />
          <ConfigRow label="Voice" value={session.voice} />
          <ConfigRow label="Temperature" value={session.temperature} />
          <ConfigRow label="Max Output Tokens" value={session.max_response_output_tokens} />
          <ConfigRow label="Input Audio Format" value={session.input_audio_format} />
          <ConfigRow label="Output Audio Format" value={session.output_audio_format} />
          {session.turn_detection && <ConfigRow label="Turn Detection" value={session.turn_detection.type} />}
          {session.tools && session.tools.length > 0 && (
            <ConfigRow label="Tools" value={`${session.tools.length} tool(s)`} />
          )}
        </dl>
        {session.instructions && (
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Instructions</div>
            <div className="max-h-[120px] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-foreground">
              {session.instructions}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ConversationCard({
  responses,
  totalUsage,
  metrics,
}: {
  responses: RealtimeResponse[];
  totalUsage?: RealtimeUsage;
  metrics?: RealtimeMetrics;
}) {
  const [open, setOpen] = useState(true);

  const handleCopy = () => {
    const transcripts = responses
      .flatMap((r) =>
        (r.output || []).flatMap((o) => (o.content || []).map((c) => `${o.role}: ${c.transcript || c.text || ""}`)),
      )
      .join("\n");
    navigator.clipboard.writeText(transcripts);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-md border border-border bg-card">
      <SectionHeader
        type="output"
        tokens={metrics?.completion_tokens ?? totalUsage?.total_tokens}
        cost={metrics?.output_cost}
        onCopy={handleCopy}
        turnCount={responses.length}
      />
      <CollapsibleContent className="border-t border-border px-4 py-3">
        {responses.map((resp, idx) => (
          <ResponseTurn key={resp.id || idx} response={resp} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ResponseTurn({ response }: { response: RealtimeResponse }) {
  const outputs = response.output || [];
  const usage = response.usage;

  return (
    <div className="mb-3 border-b border-border pb-3 last:mb-0 last:border-b-0 last:pb-0">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={response.status === "completed" ? "outline" : "secondary"}>
          {response.status || "unknown"}
        </Badge>
        {usage && (
          <span className="text-[11px] text-muted-foreground">
            {usage.input_tokens ?? 0} in / {usage.output_tokens ?? 0} out tokens
          </span>
        )}
        {response.conversation_id && (
          <span title={response.conversation_id} className="cursor-help text-[11px] text-muted-foreground">
            conv: {response.conversation_id.slice(0, 12)}...
          </span>
        )}
      </div>
      {outputs.map((output, oIdx) => (
        <OutputMessage key={output.id || oIdx} output={output} />
      ))}
      {usage?.input_token_details && <TokenBreakdown label="Input" details={usage.input_token_details} />}
      {usage?.output_token_details && <TokenBreakdown label="Output" details={usage.output_token_details} />}
    </div>
  );
}

function OutputMessage({ output }: { output: RealtimeOutputItem }) {
  const contents = output.content || [];
  const hasTranscripts = contents.some((c) => c.transcript || c.text);

  if (!hasTranscripts) return null;

  return (
    <div className="mb-2">
      <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {output.role?.toUpperCase() || "ASSISTANT"}
      </div>
      {contents.map((c, cIdx) => {
        const text = c.transcript || c.text;
        if (!text) return null;
        return (
          <div key={cIdx} className="mb-1 flex items-start gap-2">
            {c.type === "audio" && <Mic aria-hidden className="mt-1 size-3 shrink-0 text-muted-foreground" />}
            {c.type === "text" && <MessageSquare aria-hidden className="mt-1 size-3 shrink-0 text-muted-foreground" />}
            <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground">{text}</div>
          </div>
        );
      })}
    </div>
  );
}

function TokenBreakdown({ label, details }: { label: string; details: Record<string, unknown> }) {
  const entries = Object.entries(details).flatMap(([key, value]) =>
    typeof value === "number" ? [[key, value] as const] : [],
  );

  if (entries.length === 0) return null;

  return (
    <div className="mt-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label} Token Breakdown</div>
      <div className="mt-1 flex flex-wrap gap-2">
        {entries.map(([key, value]) => (
          <Badge key={key} variant="outline">
            {formatTokenLabel(key)}: {value.toLocaleString()}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === null) return null;
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{String(value)}</dd>
    </div>
  );
}

function formatTokenLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
