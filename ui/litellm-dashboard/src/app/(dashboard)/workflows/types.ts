export type RunStatus = "pending" | "running" | "paused" | "completed" | "failed";

export const RUN_STATUS_OPTIONS: readonly RunStatus[] = ["pending", "running", "paused", "completed", "failed"];

export const STATUS_LABELS: Record<RunStatus, string> = {
  pending: "Pending",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
};

export interface RunMetadata {
  title?: string;
  state?: string;
  pr_url?: string;
  worktree_path?: string;
  plan_text?: string;
  grill_session_id?: string;
  session_id?: string;
  [key: string]: unknown;
}

export interface WorkflowRun {
  run_id: string;
  status: RunStatus;
  workflow_type: string;
  created_at: string;
  metadata?: RunMetadata | null;
}

export interface WorkflowRunEvent {
  event_id: string;
  event_type: string;
  step_name: string;
  sequence_number: number;
  created_at: string;
  data?: Record<string, unknown> | null;
}

export interface WorkflowRunMessage {
  message_id: string;
  role: string;
  content: string;
  sequence_number: number;
  created_at: string;
}

export interface RunDetail {
  events: WorkflowRunEvent[];
  messages: WorkflowRunMessage[];
}

export const EMPTY_DETAIL: RunDetail = { events: [], messages: [] };
