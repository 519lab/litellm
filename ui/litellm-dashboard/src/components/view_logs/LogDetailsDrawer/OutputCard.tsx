import { useState } from "react";
import MessageManager from "@/components/molecules/message_manager";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ParsedMessage } from "./prettyMessagesTypes";
import { SectionHeader } from "./SectionHeader";
import { SimpleMessageBlock } from "./SimpleMessageBlock";

interface OutputCardProps {
  message: ParsedMessage | null;
  completionTokens?: number;
  outputCost?: number;
}

export function OutputCard({ message, completionTokens, outputCost }: OutputCardProps) {
  const [open, setOpen] = useState(true);

  const handleCopy = () => {
    if (!message) return;
    navigator.clipboard.writeText(message.content || "");
    MessageManager.success("Output copied");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-md border border-border bg-card">
      <SectionHeader type="output" tokens={completionTokens} cost={outputCost} onCopy={handleCopy} />
      <CollapsibleContent className="border-t border-border px-4 py-3">
        {message ? (
          <SimpleMessageBlock label="ASSISTANT" content={message.content} toolCalls={message.toolCalls} />
        ) : (
          <p className="text-[13px] italic text-muted-foreground">No response data available</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
