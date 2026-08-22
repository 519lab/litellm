import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cva.config";
import { fmtDuration, runTitle, timeAgo } from "./format";
import type { WorkflowRun, WorkflowRunEvent } from "./types";

interface EventTone {
  bar: string;
  text: string;
}

const EVENT_TONES: Record<string, EventTone> = {
  "step.started": { bar: "border-border bg-muted", text: "text-foreground" },
  "step.failed": { bar: "border-destructive/40 bg-destructive/10", text: "text-destructive" },
  "hook.waiting": { bar: "border-border bg-secondary", text: "text-secondary-foreground" },
  "hook.received": { bar: "border-primary/40 bg-primary/10", text: "text-primary" },
};

const DEFAULT_TONE: EventTone = { bar: "border-border bg-muted", text: "text-muted-foreground" };

function toneFor(type: string): EventTone {
  return EVENT_TONES[type] ?? DEFAULT_TONE;
}

const MAX_LEFT_PCT = 92;

interface EventBar {
  event: WorkflowRunEvent;
  leftPct: number;
  widthPct: number;
  duration: string;
}

function layoutEvent(events: WorkflowRunEvent[], runStart: number, span: number, lastTime: number) {
  return (event: WorkflowRunEvent): EventBar => {
    const start = new Date(event.created_at).getTime();
    const next = events.find((candidate) => candidate.sequence_number > event.sequence_number);
    const end = next ? new Date(next.created_at).getTime() : lastTime + Math.max(span * 0.12, 500);
    const leftPct = Math.min(((start - runStart) / span) * 100, MAX_LEFT_PCT);
    const widthPct = Math.min(Math.max(8, ((end - start) / span) * 100), 100 - leftPct);
    return { event, leftPct, widthPct, duration: fmtDuration(end - start) };
  };
}

function EventTooltip({ event }: { event: WorkflowRunEvent }) {
  const hasData = event.data !== null && event.data !== undefined && Object.keys(event.data).length > 0;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-2 font-mono text-[11px] leading-relaxed">
      <dt className="opacity-70">type</dt>
      <dd>{event.event_type}</dd>
      <dt className="opacity-70">step</dt>
      <dd>{event.step_name}</dd>
      <dt className="opacity-70">seq</dt>
      <dd className="tabular-nums">{event.sequence_number}</dd>
      <dt className="opacity-70">time</dt>
      <dd>{timeAgo(event.created_at)}</dd>
      {hasData && (
        <>
          <dt className="opacity-70">data</dt>
          <dd className="break-all">{JSON.stringify(event.data)}</dd>
        </>
      )}
    </dl>
  );
}

function EventRow({ bar }: { bar: EventBar }) {
  const { event, leftPct, widthPct, duration } = bar;
  const tone = toneFor(event.event_type);
  return (
    <>
      <div className={cn("truncate pt-0.5 pl-3", tone.text)}>{event.step_name || event.event_type}</div>
      <div className="relative h-6">
        <Tooltip>
          <TooltipTrigger
            aria-label={`${event.event_type} ${event.step_name}`.trim()}
            className={cn(
              "absolute flex h-full items-center gap-1.5 overflow-hidden rounded border pl-2 text-left outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              tone.bar,
            )}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          >
            <span className={cn("whitespace-nowrap text-[11px]", tone.text)}>{event.event_type}</span>
            {duration && <span className="whitespace-nowrap text-[11px] text-muted-foreground">{duration}</span>}
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <EventTooltip event={event} />
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}

interface StepTimelineProps {
  run: WorkflowRun;
  events: WorkflowRunEvent[];
}

export function StepTimeline({ run, events }: StepTimelineProps) {
  if (events.length === 0) {
    return <p className="py-4 font-mono text-xs text-muted-foreground">No events recorded</p>;
  }

  const runStart = new Date(run.created_at).getTime();
  const lastTime = Math.max(...events.map((event) => new Date(event.created_at).getTime()));
  const span = Math.max(lastTime - runStart, 1);
  const totalDuration = fmtDuration(lastTime - runStart);
  const bars = events.map(layoutEvent(events, runStart, span, lastTime));

  return (
    <TooltipProvider>
      <div className="font-mono text-xs">
        <div className="mb-0.5 grid grid-cols-[160px_1fr] gap-x-3">
          <div />
          <div className="flex h-4 justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span>{totalDuration}</span>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-[160px_1fr] gap-x-3">
          <div className="truncate pt-0.5 text-foreground">{runTitle(run)}</div>
          <div className="flex h-6 items-center rounded border border-border bg-muted pl-2">
            <span className="text-[11px] text-muted-foreground">{totalDuration}</span>
          </div>
        </div>

        <div className="grid grid-cols-[160px_1fr] gap-x-3 gap-y-[3px]">
          {bars.map((bar) => (
            <EventRow key={bar.event.event_id} bar={bar} />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
