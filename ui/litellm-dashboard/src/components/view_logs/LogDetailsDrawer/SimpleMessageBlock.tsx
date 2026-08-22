import { cn } from "@/lib/cva.config";
import { ToolCall } from "./prettyMessagesTypes";
import { SimpleToolCallBlock } from "./SimpleToolCallBlock";

interface SimpleMessageBlockProps {
  label: string;
  content?: string;
  toolCalls?: ToolCall[];
  isCompact?: boolean;
}

export function SimpleMessageBlock({ label, content, toolCalls, isCompact = false }: SimpleMessageBlockProps) {
  const displayContent = content && content !== "null" && content.length > 0 ? content : null;
  const hasToolCalls = toolCalls !== undefined && toolCalls.length > 0;

  if (!displayContent && !hasToolCalls) {
    return null;
  }

  return (
    <div className={cn(isCompact && "mb-2")}>
      <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      {displayContent && (
        <div
          className={cn(
            "whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground",
            hasToolCalls && "mb-1.5",
          )}
        >
          {displayContent}
        </div>
      )}
      {hasToolCalls && (
        <div>
          {toolCalls.map((tc, index) => (
            <SimpleToolCallBlock key={tc.id || index} tool={tc} compact={isCompact} />
          ))}
        </div>
      )}
    </div>
  );
}
