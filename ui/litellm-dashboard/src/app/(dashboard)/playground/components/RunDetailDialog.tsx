"use client";

import { formatDistanceToNow } from "date-fns";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlaygroundRun } from "../hooks/usePlaygroundHistory";

interface RunDetailDialogProps {
  run: PlaygroundRun | undefined;
  onClose: () => void;
}

function copyText(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function RunDetailDialog({ run, onClose }: RunDetailDialogProps) {
  return (
    <Dialog open={run !== undefined} onOpenChange={(open) => { if (!open) onClose(); }}>
      {run && (
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              {run.label ?? "Saved run"}
              <Badge variant="secondary" className="font-mono text-[10px]">{run.model}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 text-[11px] text-muted-foreground mb-3">
            <span>{formatDistanceToNow(new Date(run.timestamp), { addSuffix: true })}</span>
            <span>{run.durationMs}ms</span>
            {(run.promptTokens + run.completionTokens) > 0 && (
              <span>{run.promptTokens}↑ {run.completionTokens}↓ tok</span>
            )}
          </div>

          {run.messages.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Messages</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy messages"
                  onClick={() => copyText(JSON.stringify(run.messages, null, 2))}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
              <ScrollArea className="max-h-40 rounded border border-border bg-muted/30 p-2">
                {run.messages.map((msg, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{msg.role}</span>
                    <p className="text-xs whitespace-pre-wrap break-words mt-0.5">{msg.content}</p>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Response</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy response"
                onClick={() => copyText(run.response)}
              >
                <Copy className="size-3" />
              </Button>
            </div>
            <ScrollArea className="max-h-60 rounded border border-border bg-muted/30 p-2">
              <p className="text-xs whitespace-pre-wrap break-words">{run.response}</p>
            </ScrollArea>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
