import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ParsedMessage } from "./prettyMessagesTypes";
import { SimpleMessageBlock } from "./SimpleMessageBlock";

interface HistoryTreeProps {
  messages: ParsedMessage[];
}

export function HistoryTree({ messages }: HistoryTreeProps) {
  const [open, setOpen] = useState(false);

  if (messages.length === 0) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-2">
      <CollapsibleTrigger className="group flex items-center gap-1.5 rounded-sm py-1 text-[10px] uppercase tracking-wide text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronRight aria-hidden className="size-2.5 transition-transform group-data-panel-open:rotate-90" />
        <span>
          HISTORY ({messages.length} message{messages.length !== 1 ? "s" : ""})
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 border-l border-border pl-4">
        {messages.map((msg, index) => (
          <SimpleMessageBlock
            key={index}
            label={msg.role.toUpperCase()}
            content={msg.content}
            toolCalls={msg.toolCalls}
            isCompact={true}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
