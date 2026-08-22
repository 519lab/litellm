import React, { useState } from "react";
import { runTitle, shortId, stringify, timeAgo } from "./format";
import { StatusBadge } from "./StatusBadge";
import type { RunMetadata, WorkflowRun } from "./types";

const TRUNCATE_AT = 120;

function TruncatedValue({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  if (value.length <= TRUNCATE_AT) {
    return <span className="break-all text-foreground">{value}</span>;
  }
  return (
    <span className="break-all text-foreground">
      {expanded ? value : `${value.slice(0, TRUNCATE_AT)}…`}
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="ml-1 rounded-sm px-1 text-[11px] text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        {expanded ? "less" : "more"}
      </button>
    </span>
  );
}

function FieldPair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-px">
      <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
      <span className="text-xs">{children}</span>
    </div>
  );
}

interface PrimaryField {
  key: keyof RunMetadata & string;
  label: string;
}

const PRIMARY_FIELDS: readonly PrimaryField[] = [
  { key: "state", label: "state" },
  { key: "worktree_path", label: "worktree" },
  { key: "grill_session_id", label: "grill session" },
  { key: "session_id", label: "session" },
];

const HIDDEN_KEYS: ReadonlySet<string> = new Set(["title", "pr_url", ...PRIMARY_FIELDS.map((field) => field.key)]);

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

function Chip({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span className={`rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ${mono ? "font-mono" : ""}`}>
      {children}
    </span>
  );
}

export function RunMetadataCard({ run }: { run: WorkflowRun }) {
  const meta = run.metadata ?? {};
  const primaryEntries = PRIMARY_FIELDS.filter(({ key }) => isPresent(meta[key]));
  const extraEntries = Object.entries(meta).filter(([key, value]) => !HIDDEN_KEYS.has(key) && isPresent(value));

  return (
    <section aria-label="Run metadata" className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <StatusBadge status={run.status} />
        <span className="flex-1 truncate text-sm font-semibold text-foreground">{runTitle(run)}</span>
        <Chip mono>{shortId(run.run_id)}</Chip>
        <Chip>{run.workflow_type}</Chip>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-2 px-5 py-3 font-mono text-xs">
        <FieldPair label="status">
          <span className="capitalize text-foreground">{run.status}</span>
        </FieldPair>
        <FieldPair label="created">
          <span className="text-foreground">{timeAgo(run.created_at)}</span>
        </FieldPair>

        {meta.pr_url && (
          <FieldPair label="pr">
            <a
              href={String(meta.pr_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {String(meta.pr_url)}
            </a>
          </FieldPair>
        )}

        {primaryEntries.map(({ key, label }) => (
          <FieldPair key={key} label={label}>
            <TruncatedValue value={stringify(meta[key])} />
          </FieldPair>
        ))}

        {extraEntries.map(([key, value]) => (
          <FieldPair key={key} label={key}>
            <TruncatedValue value={stringify(value)} />
          </FieldPair>
        ))}
      </dl>
    </section>
  );
}
