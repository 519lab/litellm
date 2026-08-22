import { ChevronDown, Copy, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";

interface SectionHeaderProps {
  type: "input" | "output";
  tokens?: number;
  cost?: number;
  onCopy: () => void;
  turnCount?: number;
}

export function SectionHeader({ type, tokens, cost, onCopy, turnCount }: SectionHeaderProps) {
  const label = type === "input" ? "Input" : "Output";
  const Icon = type === "input" ? MessageSquare : Sparkles;

  return (
    <div className="flex items-center justify-between gap-2 bg-muted px-4 py-2.5">
      <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-4 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronDown
          aria-hidden
          className="size-3 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-180"
        />
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon aria-hidden className="size-3.5 text-muted-foreground" />
          {label}
        </span>
        {tokens !== undefined && (
          <span className="text-xs text-muted-foreground">Tokens: {tokens.toLocaleString()}</span>
        )}
        {cost !== undefined && cost > 0 && (
          <span className="text-xs text-muted-foreground">Cost: ${cost.toFixed(6)}</span>
        )}
        {turnCount !== undefined && turnCount > 0 && (
          <span className="text-xs text-muted-foreground">Turns: {turnCount}</span>
        )}
      </CollapsibleTrigger>
      <Button type="button" variant="ghost" size="icon-xs" aria-label={`Copy ${label.toLowerCase()}`} onClick={onCopy}>
        <Copy />
      </Button>
    </div>
  );
}
