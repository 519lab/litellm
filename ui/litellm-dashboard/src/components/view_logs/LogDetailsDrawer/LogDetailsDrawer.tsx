import { useEffect, useMemo, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Sparkles, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import CopyButton from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/cva.config";
import { getSpendString } from "@/utils/dataUtils";
import { useLogDetails } from "@/app/(dashboard)/hooks/logDetails/useLogDetails";
import { LogEntry } from "../columns";
import { AGENT_CALL_TYPES, MCP_CALL_TYPES } from "../constants";
import { getEventDisplayName } from "../utils";
import { sessionSpendLogsCall } from "../../networking";
import { DrawerHeader, LogStatus } from "./DrawerHeader";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { LogDetailContent, GuardrailJumpLink } from "./LogDetailContent";
import { SegmentedToggle } from "./SegmentedToggle";
import { normalizeGuardrailEntries, sortSessionLogs, SessionLogSortMode } from "./utils";
import { DRAWER_WIDTH_CLASS } from "./constants";

export interface LogDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  logEntry: LogEntry | null;
  sessionId?: string | null;
  accessToken?: string | null;
  allLogs?: LogEntry[];
  onSelectLog?: (log: LogEntry) => void;
  startTime?: string;
}

// Session logs are fetched page-by-page from the paginated backend and
// accumulated so the drawer can show the whole session. page_size is the
// backend maximum (le=100); the page cap bounds the fetch and the
// (un-virtualized) sidebar list for pathological sessions, keeping the most
// recent logs since the endpoint returns newest-first.
const SESSION_PAGE_SIZE = 100;
const MAX_SESSION_PAGES = 50;
const SESSION_FETCH_BATCH = 5;

const SORT_OPTIONS = [
  { value: "duration", label: "Duration" },
  { value: "start_time", label: "Start time" },
] as const;

const isLlmCall = (row: LogEntry) =>
  !MCP_CALL_TYPES.includes(row.call_type) && !AGENT_CALL_TYPES.includes(row.call_type);

const sessionTimeMs = (row: LogEntry) => Date.parse(row.endTime) - Date.parse(row.startTime);

interface TraceEventRowProps {
  row: LogEntry;
  isSelected: boolean;
  onClick: () => void;
}

function TraceEventRow({ row, isSelected, onClick }: TraceEventRowProps) {
  const Icon = MCP_CALL_TYPES.includes(row.call_type)
    ? Wrench
    : AGENT_CALL_TYPES.includes(row.call_type)
      ? Bot
      : Sparkles;
  const durationMs = row.request_duration_ms ?? (row.startTime && row.endTime ? sessionTimeMs(row) : null);
  const durationValue = durationMs != null ? (durationMs / 1000).toFixed(3) : "-";

  return (
    <button
      type="button"
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "w-full py-1 pl-8 pr-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
        isSelected ? "bg-accent" : "hover:bg-muted",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        <Icon aria-hidden className="size-3 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium text-foreground">
          {getEventDisplayName(row.call_type, row.model)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
        <span>{durationValue}s</span>
        {row.spend ? <span>· {getSpendString(row.spend)}</span> : null}
        {row.total_tokens ? <span>· {row.total_tokens} tok</span> : null}
      </div>
    </button>
  );
}

export function LogDetailsDrawer({
  open,
  onClose,
  logEntry,
  sessionId,
  accessToken,
  allLogs = [],
  onSelectLog,
  startTime,
}: LogDetailsDrawerProps) {
  const isSessionMode = Boolean(sessionId);
  const [selectedSessionRequestId, setSelectedSessionRequestId] = useState<string | null>(null);
  const [sessionSortMode, setSessionSortMode] = useState<SessionLogSortMode>("duration");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { data: sessionData } = useQuery({
    queryKey: ["sessionLogs", sessionId],
    queryFn: async () => {
      if (!sessionId || !accessToken) return { logs: [] as LogEntry[], total: 0 };

      const firstPage = await sessionSpendLogsCall(accessToken, sessionId, 1, SESSION_PAGE_SIZE);
      const firstRows: LogEntry[] = firstPage.data || firstPage || [];
      const pagesToFetch = Math.min(firstPage.total_pages ?? 1, MAX_SESSION_PAGES);
      const batchStarts = Array.from(
        { length: Math.max(0, Math.ceil((pagesToFetch - 1) / SESSION_FETCH_BATCH)) },
        (_, i) => 2 + i * SESSION_FETCH_BATCH,
      );
      const remainingRows = await batchStarts.reduce<Promise<LogEntry[]>>(async (accPromise, start) => {
        const acc = await accPromise;
        const end = Math.min(start + SESSION_FETCH_BATCH - 1, pagesToFetch);
        const batch = await Promise.all(
          Array.from({ length: end - start + 1 }, (_, i) =>
            sessionSpendLogsCall(accessToken, sessionId, start + i, SESSION_PAGE_SIZE),
          ),
        );
        return [...acc, ...batch.flatMap((page) => page.data || [])];
      }, Promise.resolve([]));
      const rows = [...firstRows, ...remainingRows];

      const total: number = firstPage.total ?? rows.length;
      const logs = rows.map((row) => ({
        ...row,
        request_duration_ms: row.request_duration_ms ?? sessionTimeMs(row),
      }));

      return { logs, total };
    },
    enabled: Boolean(open && isSessionMode && sessionId && accessToken),
  });

  const sessionLogs: LogEntry[] = useMemo(
    () => sortSessionLogs(sessionData?.logs ?? [], sessionSortMode),
    [sessionData, sessionSortMode],
  );
  const sessionTotalCount = sessionData?.total ?? sessionLogs.length;
  const sessionTruncated = sessionTotalCount > sessionLogs.length;

  const mostRecentLog = useMemo<LogEntry | null>(
    () =>
      sessionLogs.reduce<LogEntry | null>(
        (latest, row) =>
          !latest || new Date(row.startTime).getTime() > new Date(latest.startTime).getTime() ? row : latest,
        null,
      ),
    [sessionLogs],
  );

  const currentLog = useMemo(() => {
    if (!isSessionMode) return logEntry;
    if (!sessionLogs.length) return null;
    const fallbackLog = mostRecentLog ?? sessionLogs[0];
    if (selectedSessionRequestId) {
      return sessionLogs.find((row) => row.request_id === selectedSessionRequestId) || fallbackLog;
    }
    if (logEntry?.request_id) {
      return sessionLogs.find((row) => row.request_id === logEntry.request_id) || fallbackLog;
    }
    return fallbackLog;
  }, [isSessionMode, logEntry, selectedSessionRequestId, sessionLogs, mostRecentLog]);

  useEffect(() => {
    if (!isSessionMode || !sessionLogs.length) return;
    if (selectedSessionRequestId && sessionLogs.some((row) => row.request_id === selectedSessionRequestId)) return;
    const fallbackRequestId =
      logEntry?.request_id && sessionLogs.some((row) => row.request_id === logEntry.request_id)
        ? logEntry.request_id
        : (mostRecentLog ?? sessionLogs[0]).request_id;
    setSelectedSessionRequestId(fallbackRequestId);
  }, [isSessionMode, logEntry, selectedSessionRequestId, sessionLogs, mostRecentLog]);

  useEffect(() => {
    if (open) {
      setIsSidebarCollapsed(false);
      return;
    }
    if (isSessionMode) setSelectedSessionRequestId(null);
    setSessionSortMode("duration");
  }, [open, isSessionMode]);

  const { selectNextLog, selectPreviousLog } = useKeyboardNavigation({
    isOpen: open,
    currentLog,
    allLogs: isSessionMode ? sessionLogs : allLogs,
    onClose,
    onSelectLog: (selected) => {
      if (isSessionMode) {
        setSelectedSessionRequestId(selected.request_id);
      }
      onSelectLog?.(selected);
    },
  });

  const logDetails = useLogDetails(currentLog?.request_id, startTime, open && !!currentLog?.request_id);
  const detailsData = logDetails.data;
  const isLoadingDetails = logDetails.isLoading;

  const enrichedLog = useMemo(() => {
    if (!currentLog) return null;
    return {
      ...currentLog,
      messages: detailsData?.messages || currentLog.messages,
      response: detailsData?.response || currentLog.response,
      proxy_server_request: detailsData?.proxy_server_request || currentLog.proxy_server_request,
    };
  }, [currentLog, detailsData]);

  const metadata = currentLog?.metadata || {};
  const status: LogStatus = metadata.status === "failure" ? "failure" : "success";
  const environment: string | undefined = metadata.user_api_key_team_alias || undefined;
  const guardrailEntries = normalizeGuardrailEntries(metadata.guardrail_information);

  const totalSessionCost = sessionLogs.reduce((sum, row) => sum + (row.spend || 0), 0);
  const sessionStartMs = Math.min(...sessionLogs.map((r) => new Date(r.startTime).getTime()));
  const sessionEndMs = Math.max(...sessionLogs.map((r) => new Date(r.endTime).getTime()));
  const sessionDurationSeconds = sessionLogs.length > 0 ? ((sessionEndMs - sessionStartMs) / 1000).toFixed(2) : "0.00";
  const logsForList = isSessionMode ? sessionLogs : currentLog ? [currentLog] : [];
  const counts = [
    { label: "LLM", count: logsForList.filter(isLlmCall).length },
    { label: "Agent", count: logsForList.filter((row) => AGENT_CALL_TYPES.includes(row.call_type)).length },
    { label: "MCP", count: logsForList.filter((row) => MCP_CALL_TYPES.includes(row.call_type)).length },
  ];
  const leftPanelId = isSessionMode ? sessionId || "" : currentLog?.request_id || "";
  const leftPanelDisplayId = leftPanelId.length > 14 ? `${leftPanelId.slice(0, 11)}...` : leftPanelId;

  if (!currentLog || !enrichedLog) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-label={`Log ${currentLog.request_id}`}
        className={cn("gap-0 overflow-hidden bg-background p-0 text-foreground", DRAWER_WIDTH_CLASS)}
      >
        <div className="relative flex h-full">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="absolute left-2 top-2 z-20"
            aria-label={isSidebarCollapsed ? "Expand trace sidebar" : "Collapse trace sidebar"}
            aria-expanded={!isSidebarCollapsed}
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
          {!isSidebarCollapsed && (
            <aside aria-label="Trace" className="flex w-56 shrink-0 flex-col border-r border-border bg-muted">
              <div className="border-b border-border bg-background py-2 pl-12 pr-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {isSessionMode ? "Session" : "Trace"}
                </div>
                <div className="flex items-center gap-1 font-mono text-xs leading-tight text-foreground">
                  <span className="truncate" title={leftPanelId}>
                    {leftPanelDisplayId}
                  </span>
                  <CopyButton value={leftPanelId} label="Copy trace id" iconClassName="size-3" />
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {logsForList.length} req
                  {counts.map(({ label, count }) =>
                    count > 0 ? (
                      <span key={label}>
                        <span className="mx-1.5">·</span>
                        {count} {label}
                      </span>
                    ) : null,
                  )}
                  <span className="mx-1.5">·</span>
                  {getSpendString(isSessionMode ? totalSessionCost : currentLog.spend || 0)}
                  {isSessionMode && (
                    <>
                      <span className="mx-1.5">·</span>
                      {sessionDurationSeconds}s
                    </>
                  )}
                </div>
                {isSessionMode && sessionTruncated && (
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Showing most recent {logsForList.length} of {sessionTotalCount}
                  </div>
                )}
                {isSessionMode && (
                  <div className="mt-1.5">
                    <SegmentedToggle
                      label="Sort session logs"
                      options={SORT_OPTIONS}
                      value={sessionSortMode}
                      onChange={setSessionSortMode}
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {guardrailEntries.length > 0 && (
                  <div className="px-3 pt-2">
                    <GuardrailJumpLink guardrailEntries={guardrailEntries} />
                  </div>
                )}
                <div className="py-1">
                  {isSessionMode ? (
                    <div className="relative pl-2">
                      <div aria-hidden className="absolute bottom-1 left-4 top-1 border-l border-border" />
                      {logsForList.map((row, idx) => (
                        <div key={row.request_id} className="relative">
                          <div aria-hidden className="absolute left-4 top-3 w-3 border-t border-border" />
                          {idx === logsForList.length - 1 && (
                            <div aria-hidden className="absolute bottom-0 left-4 top-3 w-px bg-muted" />
                          )}
                          <TraceEventRow
                            row={row}
                            isSelected={row.request_id === currentLog.request_id}
                            onClick={() => {
                              setSelectedSessionRequestId(row.request_id);
                              onSelectLog?.(row);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    logsForList.map((row) => (
                      <TraceEventRow
                        key={row.request_id}
                        row={row}
                        isSelected={row.request_id === currentLog.request_id}
                        onClick={() => onSelectLog?.(row)}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>
          )}

          <div className="flex flex-1 flex-col overflow-hidden">
            <DrawerHeader
              log={currentLog}
              onClose={onClose}
              onPrevious={selectPreviousLog}
              onNext={selectNextLog}
              status={status}
              environment={environment}
            />
            <div className="flex-1 overflow-y-auto">
              <LogDetailContent
                logEntry={enrichedLog}
                isLoadingDetails={isLoadingDetails}
                accessToken={accessToken ?? null}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
