import React from "react";
import { ChevronDown, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cva.config";
import { runTitle } from "./format";
import { MessageList } from "./MessageList";
import { RunMetadataCard } from "./RunMetadataCard";
import { StepTimeline } from "./StepTimeline";
import type { RunDetail, WorkflowRun } from "./types";

const SHEET_WIDTH_CLASS = "data-[side=right]:w-full data-[side=right]:sm:w-[680px] data-[side=right]:sm:max-w-none";

interface DetailSectionProps {
  title: string;
  count: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function DetailSection({ title, count, defaultOpen, children }: DetailSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/section border-b border-border last:border-b-0">
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-xs font-medium text-foreground outline-none",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        )}
      >
        <ChevronDown className="size-3.5 -rotate-90 text-muted-foreground transition-transform group-data-[panel-open]/section:rotate-0" />
        {title}
        <span className="text-[11px] font-normal text-muted-foreground tabular-nums">{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading run details" role="status">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-6 w-3/4" />
    </div>
  );
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

interface RunDetailSheetProps {
  run: WorkflowRun | null;
  detail: RunDetail;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onRefresh: (run: WorkflowRun) => void;
}

function DetailBody({ run, detail }: { run: WorkflowRun; detail: RunDetail }) {
  return (
    <>
      <RunMetadataCard run={run} />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <DetailSection title="Timeline" count={pluralize(detail.events.length, "event", "events")} defaultOpen>
          <StepTimeline run={run} events={detail.events} />
        </DetailSection>
        <DetailSection title="Messages" count={String(detail.messages.length)}>
          <MessageList messages={detail.messages} />
        </DetailSection>
      </div>
    </>
  );
}

export function RunDetailSheet({ run, detail, open, loading, onClose, onRefresh }: RunDetailSheetProps) {
  if (run === null) return null;
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn("gap-0 overflow-y-auto bg-background p-0 text-foreground", SHEET_WIDTH_CLASS)}
      >
        <div className="px-7 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <SheetTitle className="text-sm">Run details</SheetTitle>
              <SheetDescription className="sr-only">
                Metadata, timeline and messages for {runTitle(run)}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => onRefresh(run)} disabled={loading}>
                <RefreshCw className={cn(loading && "animate-spin")} />
                Refresh
              </Button>
              <SheetClose render={<Button variant="ghost" size="icon-sm" />}>
                <X />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
          </div>
          {loading ? <DetailSkeleton /> : <DetailBody run={run} detail={detail} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
