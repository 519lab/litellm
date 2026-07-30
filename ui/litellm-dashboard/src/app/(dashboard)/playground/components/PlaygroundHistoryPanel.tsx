"use client";

import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PlaygroundRun } from "../hooks/usePlaygroundHistory";

interface PlaygroundHistoryPanelProps {
  runs: PlaygroundRun[];
  onView: (run: PlaygroundRun) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

function relativeTime(ts: number): string {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "unknown time";
  }
}

function tokenSummary(run: PlaygroundRun): string {
  const total = run.promptTokens + run.completionTokens;
  return total > 0 ? `${total} tok` : "";
}

export function PlaygroundHistoryPanel({
  runs,
  onView,
  onDelete,
  onClear,
  isOpen,
  onClose,
}: PlaygroundHistoryPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b flex-row items-center justify-between">
          <SheetTitle className="text-sm font-semibold">Run History</SheetTitle>
          {runs.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Clear all history">
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all {runs.length} saved runs from your browser. It cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClear}>Clear all</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </SheetHeader>

        {runs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-xs text-muted-foreground">
              No runs saved yet.
              <br />
              Use the &quot;Save run&quot; button after a response.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 h-0">
            <div className="flex flex-col gap-1 p-2">
              {runs.map((run) => (
                <div
                  key={run.id}
                  role="button"
                  tabIndex={0}
                  className="group relative flex flex-col gap-1 rounded-md border border-border bg-card p-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors w-full cursor-pointer"
                  onClick={() => onView(run)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onView(run);
                    }
                  }}
                  aria-label={`View run: ${run.label ?? run.model}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      {run.label && (
                        <span className="text-xs font-medium text-foreground truncate">{run.label}</span>
                      )}
                      <Badge variant="secondary" className="w-fit text-[10px] font-mono truncate max-w-[180px]">
                        {run.model}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0 -mt-1 -mr-1"
                      aria-label={`Delete run: ${run.label ?? run.model}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(run.id);
                      }}
                    >
                      <Trash2 className="size-3 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{relativeTime(run.timestamp)}</span>
                    {tokenSummary(run) && (
                      <>
                        <span>·</span>
                        <span>{tokenSummary(run)}</span>
                      </>
                    )}
                  </div>
                  {run.response && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {run.response.slice(0, 120)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
