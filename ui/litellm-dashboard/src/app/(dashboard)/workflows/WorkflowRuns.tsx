import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { Workflow } from "lucide-react";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchRunDetail, fetchWorkflowRuns } from "./api";
import { RunDetailSheet } from "./RunDetailSheet";
import { buildRunColumns } from "./runColumns";
import { EMPTY_DETAIL, RUN_STATUS_OPTIONS, STATUS_LABELS, type RunDetail, type WorkflowRun } from "./types";

interface WorkflowRunsProps {
  accessToken: string | null;
}

function EmptyRuns() {
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Workflow className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">No workflow runs yet</div>
      <div className="text-sm text-muted-foreground">Runs appear here once an agent or workflow starts.</div>
    </div>
  );
}

const WorkflowRuns: React.FC<WorkflowRunsProps> = ({ accessToken }) => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [detail, setDetail] = useState<RunDetail>(EMPTY_DETAIL);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadRuns = useCallback(async () => {
    if (!accessToken) return;
    setLoadingRuns(true);
    try {
      setRuns(await fetchWorkflowRuns(accessToken));
    } catch (err) {
      console.error("workflow runs fetch failed:", err);
    } finally {
      setLoadingRuns(false);
    }
  }, [accessToken]);

  const openRun = useCallback(
    async (run: WorkflowRun) => {
      if (!accessToken) return;
      setSelectedRun(run);
      setSheetOpen(true);
      setLoadingDetail(true);
      setDetail(EMPTY_DETAIL);
      try {
        setDetail(await fetchRunDetail(accessToken, run.run_id));
      } catch (err) {
        console.error("workflow run detail fetch failed:", err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const columns = useMemo(() => buildRunColumns(openRun), [openRun]);

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-background px-8 py-6 text-foreground">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Workflow Runs</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Durable state tracking for agents and automated workflows
        </p>
      </div>

      <DataTable
        data={runs}
        columns={columns}
        getRowId={(run) => run.run_id}
        isLoading={loadingRuns}
        loadingMessage="Loading workflow runs…"
        noDataMessage={<EmptyRuns />}
        paginationMode="client"
        pageSizeOptions={[50, 100]}
        filterMode="client"
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        onRowClick={openRun}
        size="compact"
        toolbar={(table) => (
          <>
            <DataTableToolbar
              table={table}
              searchValue={globalFilter}
              onSearchChange={setGlobalFilter}
              searchPlaceholder="Search runs…"
              onRefresh={loadRuns}
              isRefreshing={loadingRuns}
              onOpenFilters={() => setFiltersOpen(true)}
            />
            <DataTableFilterDrawer
              table={table}
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              title="Filters"
              description="Narrow down workflow runs"
            >
              {({ get, set }) => (
                <>
                  <DataTableFilterField label="Status">
                    <Select
                      items={STATUS_LABELS}
                      value={(get("status") as string) || null}
                      onValueChange={(value: string | null) => set("status", value ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>All statuses</SelectItem>
                        {RUN_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </DataTableFilterField>
                  <DataTableFilterField label="Type">
                    <Input
                      value={(get("workflow_type") as string) ?? ""}
                      onChange={(event) => set("workflow_type", event.target.value)}
                      placeholder="Filter by type…"
                    />
                  </DataTableFilterField>
                </>
              )}
            </DataTableFilterDrawer>
          </>
        )}
      />

      <RunDetailSheet
        run={selectedRun}
        detail={detail}
        open={sheetOpen}
        loading={loadingDetail}
        onClose={() => setSheetOpen(false)}
        onRefresh={openRun}
      />
    </div>
  );
};

export default WorkflowRuns;
