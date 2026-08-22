import { useState } from "react";
import MessageManager from "@/components/molecules/message_manager";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ParsedMessage } from "./prettyMessagesTypes";
import { SectionHeader } from "./SectionHeader";
import { CollapsibleMessage } from "./CollapsibleMessage";
import { HistoryTree } from "./HistoryTree";
import { SimpleMessageBlock } from "./SimpleMessageBlock";

interface InputCardProps {
  messages: ParsedMessage[];
  promptTokens?: number;
  inputCost?: number;
}

export function InputCard({ messages, promptTokens, inputCost }: InputCardProps) {
  const [open, setOpen] = useState(true);

  if (messages.length === 0) {
    return null;
  }

  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  const lastMessage = nonSystemMessages.length > 0 ? nonSystemMessages[nonSystemMessages.length - 1] : null;
  const historyMessages = nonSystemMessages.slice(0, -1);

  const handleCopy = () => {
    navigator.clipboard.writeText(lastMessage?.content || "");
    MessageManager.success("Input copied");
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mb-2 overflow-hidden rounded-md border border-border bg-card"
    >
      <SectionHeader type="input" tokens={promptTokens} cost={inputCost} onCopy={handleCopy} />
      <CollapsibleContent className="border-t border-border px-4 py-3">
        {systemMessage && (
          <CollapsibleMessage
            label="SYSTEM"
            content={systemMessage.content}
            defaultExpanded={!!(systemMessage.content && systemMessage.content.length < 200)}
          />
        )}
        {historyMessages.length > 0 && <HistoryTree messages={historyMessages} />}
        {lastMessage && (
          <SimpleMessageBlock
            label={lastMessage.role.toUpperCase()}
            content={lastMessage.content}
            toolCalls={lastMessage.toolCalls}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
