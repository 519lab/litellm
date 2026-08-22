import CopyButton from "@/components/shared/CopyButton";
import { cn } from "@/lib/cva.config";

interface TruncatedValueProps {
  value?: string;
  className?: string;
}

export function TruncatedValue({ value, className = "max-w-[180px]" }: TruncatedValueProps) {
  if (!value) return <span className="text-muted-foreground">-</span>;

  return (
    <span className="inline-flex max-w-full items-center gap-1 align-bottom">
      <span title={value} className={cn("truncate font-mono text-xs text-foreground", className)}>
        {value}
      </span>
      <CopyButton value={value} label="Copy" iconClassName="size-3" />
    </span>
  );
}
