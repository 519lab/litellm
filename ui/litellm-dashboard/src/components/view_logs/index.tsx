import moment from "moment";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { internalUserRoles } from "../../utils/roles";
import DeletedKeysPage from "../DeletedKeysPage/DeletedKeysPage";
import DeletedTeamsPage from "../DeletedTeamsPage/DeletedTeamsPage";
import { KeyResponse } from "../key_team_helpers/key_list";
import { keyInfoV1Call } from "../networking";
import KeyInfoView from "../templates/key_info_view";
import AuditLogs from "./audit_logs";
import { createColumns, LogEntry, type LogsSortField } from "./columns";
import { useLogColumnVisibility } from "./columnVisibility";
import { AGENT_CALL_TYPES, MCP_CALL_TYPES } from "./constants";
import { getLogFilterOptions } from "./filter_options";
import { useLogFilterLogic, defaultFilters, FILTER_KEYS, type LogFilterState } from "./log_filter_logic";
import { useSearchParams } from "next/navigation";
import { LogDetailsDrawer } from "./LogDetailsDrawer";
import { LogFiltersPanel } from "./LogFiltersPanel";
import { LogsToolbar, type ColumnToggle } from "./LogsToolbar";
import { DataTable } from "./table";
import { defaultTimeRange, timeRangeEndTime, type TimeRange } from "./timeRange";
import { AntDLoadingSpinner } from "../ui/AntDLoadingSpinner";

const PAGE_SIZE = 50;

type LogsTab = "request logs" | "audit logs" | "deleted keys" | "deleted teams";

interface SpendLogsTableProps {
  accessToken: string | null;
  token: string | null;
  userRole: string | null;
  userID: string | null;
  premiumUser: boolean;
}

const countActiveFilters = (filters: LogFilterState): number =>
  Object.values(filters).filter((value) => value !== "").length;

type SessionCallKind = "llm" | "agent" | "mcp";

const sessionCallKind = (callType: string): SessionCallKind => {
  if (MCP_CALL_TYPES.includes(callType)) return "mcp";
  if (AGENT_CALL_TYPES.includes(callType)) return "agent";
  return "llm";
};

export default function SpendLogsTable({ accessToken, token, userRole, userID, premiumUser }: SpendLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<LogFilterState>(() => {
    const requestId = searchParams?.get("request_id");
    return requestId ? { ...defaultFilters, [FILTER_KEYS.REQUEST_ID]: requestId } : defaultFilters;
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedKeyInfo, setSelectedKeyInfo] = useState<KeyResponse | null>(null);
  const [selectedKeyIdInfoView, setSelectedKeyIdInfoView] = useState<string | null>(null);
  const [filterByCurrentUser, setFilterByCurrentUser] = useState(userRole && internalUserRoles.includes(userRole));
  const [activeTab, setActiveTab] = useState<LogsTab>("request logs");

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<LogsSortField>("startTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isLiveTail, setIsLiveTail] = useState<boolean>(() => {
    const storedValue = sessionStorage.getItem("isLiveTail");
    return storedValue !== null ? JSON.parse(storedValue) : true;
  });

  useEffect(() => {
    sessionStorage.setItem("isLiveTail", JSON.stringify(isLiveTail));
  }, [isLiveTail]);

  useEffect(() => {
    const fetchKeyInfo = async () => {
      if (selectedKeyIdInfoView && accessToken) {
        const keyData = await keyInfoV1Call(accessToken, selectedKeyIdInfoView);

        const keyResponse: KeyResponse = {
          ...keyData["info"],
          token: selectedKeyIdInfoView,
          api_key: selectedKeyIdInfoView,
        };
        setSelectedKeyInfo(keyResponse);
      }
    };
    fetchKeyInfo();
  }, [selectedKeyIdInfoView, accessToken]);

  useEffect(() => {
    if (userRole && internalUserRoles.includes(userRole)) {
      setFilterByCurrentUser(true);
    }
  }, [userRole]);

  const {
    logsQuery,
    filteredLogs,
    allTeams,
    handleFilterChange,
    handleFilterReset: handleFilterResetFromHook,
  } = useLogFilterLogic({
    accessToken,
    token,
    userRole,
    userID,
    filters,
    setFilters,
    filterByCurrentUser: !!filterByCurrentUser,
    activeTab,
    isLiveTail,
    startTime: timeRange.startTime,
    endTime: timeRangeEndTime(timeRange),
    pageSize: PAGE_SIZE,
    isCustomDate: timeRange.mode === "custom",
    setCurrentPage,
    sortBy,
    sortOrder,
    currentPage,
  });

  const handleFilterReset = useCallback(() => {
    handleFilterResetFromHook();
    setTimeRange(defaultTimeRange());
    setCurrentPage(1);
  }, [handleFilterResetFromHook]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((newSortBy: LogsSortField, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  }, []);

  const columns = useMemo(
    () => createColumns({ sortBy, sortOrder, onSortChange: handleSortChange }),
    [sortBy, sortOrder, handleSortChange],
  );

  const filteredData = useMemo(() => {
    const searchedLogs = filteredLogs.data.filter(
      (log) =>
        !searchTerm ||
        log.request_id.includes(searchTerm) ||
        log.model.includes(searchTerm) ||
        (log.user && log.user.includes(searchTerm)),
    );

    const sessionCompositionById = searchedLogs.reduce<Record<string, Record<SessionCallKind, number>>>((acc, log) => {
      if (!log.session_id) return acc;
      const current = acc[log.session_id] ?? { llm: 0, agent: 0, mcp: 0 };
      const kind = sessionCallKind(log.call_type);
      return { ...acc, [log.session_id]: { ...current, [kind]: current[kind] + 1 } };
    }, {});

    const sessionRepresentativeById = searchedLogs.reduce<Record<string, { requestId: string; isMcp: boolean }>>(
      (acc, log) => {
        if (!log.session_id || (log.session_total_count || 1) <= 1) return acc;
        const isMcp = MCP_CALL_TYPES.includes(log.call_type);
        const existing = acc[log.session_id];
        if (existing && !(existing.isMcp && !isMcp)) return acc;
        return { ...acc, [log.session_id]: { requestId: log.request_id, isMcp } };
      },
      {},
    );

    return searchedLogs
      .map((log) => {
        const sessionComposition = log.session_id ? sessionCompositionById[log.session_id] : undefined;
        return {
          ...log,
          session_llm_count: sessionComposition?.llm,
          session_mcp_count: sessionComposition?.mcp,
          session_agent_count: sessionComposition?.agent,
          onKeyHashClick: (keyHash: string) => setSelectedKeyIdInfoView(keyHash),
          onSessionClick: (sessionId: string) => {
            if (!sessionId) return;
            setSelectedSessionId(sessionId);
            setSelectedLog(log);
            setIsDrawerOpen(true);
          },
        };
      })
      .filter((log) => {
        if (!log.session_id || (log.session_total_count || 1) <= 1) return true;
        return sessionRepresentativeById[log.session_id]?.requestId === log.request_id;
      });
  }, [filteredLogs.data, searchTerm]);

  const deferredData = useDeferredValue(filteredData);
  const isStale = deferredData !== filteredData;
  const isFetching = logsQuery.isFetching || isStale;
  const isLogsLoading = logsQuery.isLoading || logsQuery.isPlaceholderData;

  const { columnVisibility, setColumnVisible } = useLogColumnVisibility(deferredData);

  const columnToggles = useMemo<readonly ColumnToggle[]>(
    () =>
      columns.flatMap((column) => {
        const label = column.meta?.label;
        if (!column.id || !label) return [];
        return [{ id: column.id, label, visible: columnVisibility[column.id] ?? true }];
      }),
    [columns, columnVisibility],
  );

  if (!accessToken || !token || !userRole || !userID) {
    return (
      <div className="flex items-center justify-center h-64">
        <AntDLoadingSpinner size="large" />
      </div>
    );
  }

  const handleRowClick = (log: LogEntry) => {
    const isMultiCallSession = !!log.session_id && (log.session_total_count || 1) > 1;
    setSelectedSessionId(isMultiCallSession ? log.session_id ?? null : null);
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="w-full p-6 overflow-x-hidden box-border">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogsTab)}>
        <TabsList variant="line" className="mb-3 h-auto w-full justify-start rounded-none border-b border-border p-0">
          <TabsTrigger value="request logs" className="flex-none rounded-none px-3 py-2">
            Request Logs
          </TabsTrigger>
          <TabsTrigger value="audit logs" className="flex-none rounded-none px-3 py-2">
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="deleted keys" className="flex-none rounded-none px-3 py-2">
            Deleted Keys
          </TabsTrigger>
          <TabsTrigger value="deleted teams" className="flex-none rounded-none px-3 py-2">
            Deleted Teams
          </TabsTrigger>
        </TabsList>
        <TabsContent value="request logs">
          {selectedKeyInfo && selectedKeyIdInfoView && selectedKeyInfo.api_key === selectedKeyIdInfoView ? (
            <KeyInfoView
              keyId={selectedKeyIdInfoView}
              keyData={selectedKeyInfo}
              teams={allTeams ?? []}
              onClose={() => setSelectedKeyIdInfoView(null)}
              backButtonText="Back to Logs"
            />
          ) : (
            <div className="w-full max-w-full rounded-lg border border-border bg-background shadow-sm box-border">
              <LogsToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
                activeFilterCount={activeFilterCount}
                filtersOpen={filtersOpen}
                onFiltersOpenChange={setFiltersOpen}
                onResetFilters={handleFilterReset}
                isLiveTail={isLiveTail}
                onIsLiveTailChange={setIsLiveTail}
                isFetching={isFetching}
                onRefresh={() => logsQuery.refetch()}
                columns={columnToggles}
                onColumnVisibleChange={setColumnVisible}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                isLoading={isLogsLoading}
                results={filteredLogs}
              />
              {filtersOpen && (
                <LogFiltersPanel
                  options={getLogFilterOptions(accessToken)}
                  values={filters}
                  onChange={(name, value) => handleFilterChange({ [name]: value })}
                />
              )}
              <DataTable
                columns={columns}
                data={deferredData}
                getRowId={(row) => row.request_id}
                onRowClick={handleRowClick}
                isLoading={isLogsLoading}
                columnVisibility={columnVisibility}
                noDataMessage="No requests in this range"
                noDataHint="Try widening the time range or clearing filters."
                errorMessage={logsQuery.error ? "Could not load request logs." : null}
                onRetry={() => logsQuery.refetch()}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="audit logs">
          <AuditLogs
            userID={userID}
            userRole={userRole}
            token={token}
            accessToken={accessToken}
            isActive={activeTab === "audit logs"}
            premiumUser={premiumUser}
          />
        </TabsContent>
        <TabsContent value="deleted keys">
          <DeletedKeysPage />
        </TabsContent>
        <TabsContent value="deleted teams">
          <DeletedTeamsPage />
        </TabsContent>
      </Tabs>

      <LogDetailsDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedSessionId(null);
        }}
        logEntry={selectedLog}
        sessionId={selectedSessionId}
        accessToken={accessToken}
        allLogs={filteredData}
        onSelectLog={setSelectedLog}
        startTime={moment(timeRange.startTime).utc().format("YYYY-MM-DD HH:mm:ss")}
      />
    </div>
  );
}
