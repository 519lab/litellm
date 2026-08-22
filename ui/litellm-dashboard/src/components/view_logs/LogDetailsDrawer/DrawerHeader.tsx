import { useState } from "react";
import { Check, ChevronDown, ChevronUp, CircleAlert, X } from "lucide-react";
import moment from "moment";
import CopyButton from "@/components/shared/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogEntry } from "../columns";
import { getProviderLogoAndName } from "../../provider_info_helpers";

export type LogStatus = "success" | "failure";

interface DrawerHeaderProps {
  log: LogEntry;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  status: LogStatus;
  environment?: string;
}

export function DrawerHeader({ log, onClose, onPrevious, onNext, status, environment }: DrawerHeaderProps) {
  const providerInfo = log.custom_llm_provider ? getProviderLogoAndName(log.custom_llm_provider) : null;

  return (
    <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background px-6 py-4">
      <div className="flex items-center gap-2">
        {providerInfo?.logo && <ProviderLogo src={providerInfo.logo} alt={providerInfo.displayName} />}
        <h2 className="truncate text-sm font-semibold text-foreground">{log.model}</h2>
        {providerInfo?.displayName && <span className="text-xs text-muted-foreground">{providerInfo.displayName}</span>}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-1">
          <span title={log.request_id} className="truncate font-mono text-base font-semibold text-foreground">
            {log.request_id}
          </span>
          <CopyButton value={log.request_id} label="Copy request ID" />
        </div>
        <nav aria-label="Log navigation" className="flex items-center gap-1">
          <NavButton label="Previous log" hint="K" onClick={onPrevious}>
            <ChevronUp />
          </NavButton>
          <NavButton label="Next log" hint="J" onClick={onNext}>
            <ChevronDown />
          </NavButton>
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            title="Esc to close"
            onClick={onClose}
          >
            <X />
          </Button>
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={status} />
        {environment && <Badge variant="outline">Env: {environment}</Badge>}
        <time
          dateTime={log.startTime}
          title={moment(log.startTime).format("MMM D, YYYY h:mm:ss A")}
          className="text-[13px] text-muted-foreground"
        >
          {moment(log.startTime).fromNow()}
        </time>
      </div>
    </header>
  );
}

function ProviderLogo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt={alt} className="size-6 shrink-0" onError={() => setFailed(true)} />;
}

function NavButton({
  label,
  hint,
  onClick,
  children,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant="ghost" size="sm" aria-label={`${label} (${hint})`} onClick={onClick}>
      {children}
      <kbd className="rounded-sm border border-border bg-muted px-1 font-mono text-[11px] text-muted-foreground">
        {hint}
      </kbd>
    </Button>
  );
}

function StatusBadge({ status }: { status: LogStatus }) {
  if (status === "failure") {
    return (
      <Badge variant="destructive">
        <CircleAlert aria-hidden />
        Failure
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <Check aria-hidden />
      Success
    </Badge>
  );
}
