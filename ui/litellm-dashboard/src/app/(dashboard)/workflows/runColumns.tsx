import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { runTitle, shortId, timeAgo } from "./format";
import { StatusBadge } from "./StatusBadge";
import type { WorkflowRun } from "./types";

function RunCell({ run, onOpen }: { run: WorkflowRun; onOpen: (run: WorkflowRun) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(run)}
      className="rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="block text-[13px] leading-snug font-medium text-foreground">{runTitle(run)}</span>
      <span className="block font-mono text-[11px] text-muted-foreground">{shortId(run.run_id)}</span>
    </button>
  );
}

export function buildRunColumns(onOpen: (run: WorkflowRun) => void): ColumnDef<WorkflowRun, unknown>[] {
  return [
    {
      id: "run",
      accessorFn: (row) => `${runTitle(row)} ${row.run_id}`,
      header: "Run",
      meta: { title: "Run", skeleton: "twoLine" },
      cell: ({ row }) => <RunCell run={row.original} onOpen={onOpen} />,
    },
    {
      accessorKey: "workflow_type",
      header: "Type",
      meta: { title: "Type" },
      filterFn: "includesString",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.workflow_type}</span>,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      meta: { title: "Status" },
      filterFn: "equalsString",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} label={row.original.metadata?.state ?? row.original.status} />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      meta: { title: "Created" },
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{timeAgo(row.original.created_at)}</span>,
    },
  ];
}
