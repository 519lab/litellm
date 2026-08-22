import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CollapsibleMessageProps {
  label: string;
  content?: string;
  defaultExpanded?: boolean;
}

export function CollapsibleMessage({ label, content, defaultExpanded = false }: CollapsibleMessageProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const charCount = content?.length || 0;

  if (!content || charCount === 0) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-2">
      <CollapsibleTrigger className="group flex items-center gap-1.5 rounded-sm py-1 text-[10px] uppercase tracking-wide text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronRight aria-hidden className="size-2.5 transition-transform group-data-panel-open:rotate-90" />
        <span>{label}</span>
        <span className="normal-case tracking-normal">({charCount.toLocaleString()} chars)</span>
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted className="mt-1">
        <div className="whitespace-pre-wrap break-words border-l border-border pl-4 text-[13px] leading-relaxed text-foreground">
          {content}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
