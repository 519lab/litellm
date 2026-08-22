import type { VisibilityState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import type { LogEntry } from "./columns";
import { AGENT_CALL_TYPES, MCP_CALL_TYPES } from "./constants";

export const COLUMN_VISIBILITY_STORAGE_KEY = "litellm.logs.columnVisibility";

export const UNIFORM_HIDDEN_COLUMN_IDS = ["type", "status", "spend"] as const;
type UniformColumnId = (typeof UNIFORM_HIDDEN_COLUMN_IDS)[number];

const isPlainLlmRow = (row: LogEntry): boolean =>
  !MCP_CALL_TYPES.includes(row.call_type) &&
  !AGENT_CALL_TYPES.includes(row.call_type) &&
  (row.session_total_count ?? 1) <= 1;

const isSuccessRow = (row: LogEntry): boolean => String(row.metadata?.status ?? "success").toLowerCase() !== "failure";

const isZeroCostRow = (row: LogEntry): boolean => !(row.session_total_spend ?? row.spend);

const UNIFORM_PREDICATES: Record<UniformColumnId, (row: LogEntry) => boolean> = {
  type: isPlainLlmRow,
  status: isSuccessRow,
  spend: isZeroCostRow,
};

export const computeUniformHiddenColumns = (rows: readonly LogEntry[]): VisibilityState =>
  Object.fromEntries(UNIFORM_HIDDEN_COLUMN_IDS.map((id) => [id, !rows.every(UNIFORM_PREDICATES[id])]));

const isVisibilityState = (value: unknown): value is VisibilityState =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === "boolean");

export const parseColumnOverrides = (raw: string | null): VisibilityState => {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return isVisibilityState(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const readStoredOverrides = (): VisibilityState =>
  typeof window === "undefined" ? {} : parseColumnOverrides(window.localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY));

export function useLogColumnVisibility(rows: readonly LogEntry[]) {
  const [overrides, setOverrides] = useState<VisibilityState>(readStoredOverrides);

  const columnVisibility = useMemo<VisibilityState>(
    () => ({ ...computeUniformHiddenColumns(rows), ...overrides }),
    [rows, overrides],
  );

  const setColumnVisible = useCallback((columnId: string, visible: boolean) => {
    setOverrides((prev) => {
      const next = { ...prev, [columnId]: visible };
      window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { columnVisibility, setColumnVisible };
}
