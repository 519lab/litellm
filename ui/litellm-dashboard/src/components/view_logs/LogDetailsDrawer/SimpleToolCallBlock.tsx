import { cn } from "@/lib/cva.config";
import { ToolCall } from "./prettyMessagesTypes";

interface SimpleToolCallBlockProps {
  tool: ToolCall;
  compact?: boolean;
}

export function SimpleToolCallBlock({ tool, compact = false }: SimpleToolCallBlockProps) {
  return (
    <div
      className={cn(
        "relative mt-2 rounded-md border border-border bg-muted font-mono text-xs",
        compact ? "px-2.5 py-1.5" : "px-3.5 py-2.5",
      )}
    >
      <div className="absolute -top-2 left-3 rounded-sm border border-border bg-card px-1.5 text-[10px] text-muted-foreground">
        function
      </div>
      <div className="mb-1.5 text-[13px] font-semibold text-foreground">{tool.name}</div>
      {Object.keys(tool.arguments).length > 0 && (
        <div>
          {Object.entries(tool.arguments).map(([key, value]) => (
            <div key={key} className="mb-0.5">
              <span className="text-muted-foreground">{key}: </span>
              <span className="text-foreground">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
