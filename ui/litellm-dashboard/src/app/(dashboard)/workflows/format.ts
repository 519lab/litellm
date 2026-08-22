import type { WorkflowRun } from "./types";

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return iso;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function fmtDuration(ms: number): string {
  if (ms < 0) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function runTitle(run: WorkflowRun): string {
  const title = run.metadata?.title;
  if (title) return String(title);
  return run.workflow_type ?? run.run_id.slice(0, 8);
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function stringify(value: unknown): string {
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
