import type { LucideIcon } from "lucide-react";
import { Check, CircleAlert, Clock, Loader2, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";
import type { RunStatus } from "./types";

type BadgeVariant = "outline" | "secondary" | "destructive";

interface StatusPresentation {
  variant: BadgeVariant;
  Icon: LucideIcon;
  spin: boolean;
}

const PRESENTATION: Record<RunStatus, StatusPresentation> = {
  pending: { variant: "secondary", Icon: Clock, spin: false },
  running: { variant: "secondary", Icon: Loader2, spin: true },
  paused: { variant: "secondary", Icon: Pause, spin: false },
  completed: { variant: "outline", Icon: Check, spin: false },
  failed: { variant: "destructive", Icon: CircleAlert, spin: false },
};

function isKnownStatus(status: string): status is RunStatus {
  return status in PRESENTATION;
}

interface StatusBadgeProps {
  status: RunStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const { variant, Icon, spin } = isKnownStatus(status) ? PRESENTATION[status] : PRESENTATION.pending;
  return (
    <Badge variant={variant} data-status={status} className={cn("capitalize", className)}>
      <Icon aria-hidden className={cn(spin && "animate-spin")} />
      {label ?? status}
    </Badge>
  );
}
