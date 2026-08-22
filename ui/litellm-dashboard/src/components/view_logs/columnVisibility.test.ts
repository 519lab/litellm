import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { LogEntry } from "./columns";
import {
  COLUMN_VISIBILITY_STORAGE_KEY,
  computeUniformHiddenColumns,
  parseColumnOverrides,
  useLogColumnVisibility,
} from "./columnVisibility";

const logEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  request_id: "req-1",
  api_key: "key-1",
  team_id: "team-1",
  model: "llama",
  model_id: "model-1",
  call_type: "acompletion",
  spend: 0,
  total_tokens: 10,
  prompt_tokens: 5,
  completion_tokens: 5,
  startTime: "2026-07-07T09:50:13Z",
  endTime: "2026-07-07T09:50:14Z",
  cache_hit: "false",
  messages: [],
  response: {},
  metadata: { status: "success" },
  ...overrides,
});

describe("computeUniformHiddenColumns", () => {
  it("hides Type, Status and Cost when every row is a zero-cost successful LLM call", () => {
    expect(computeUniformHiddenColumns([logEntry(), logEntry({ request_id: "req-2" })])).toEqual({
      type: false,
      status: false,
      spend: false,
    });
  });

  it("shows Status when any row on the page failed", () => {
    const rows = [logEntry(), logEntry({ request_id: "req-2", metadata: { status: "failure" } })];
    expect(computeUniformHiddenColumns(rows).status).toBe(true);
  });

  it("shows Type when any row is an MCP, agent or multi-call session row", () => {
    expect(computeUniformHiddenColumns([logEntry(), logEntry({ call_type: "call_mcp_tool" })]).type).toBe(true);
    expect(computeUniformHiddenColumns([logEntry({ call_type: "asend_message" })]).type).toBe(true);
    expect(computeUniformHiddenColumns([logEntry({ session_id: "s", session_total_count: 3 })]).type).toBe(true);
  });

  it("shows Cost when any row has nonzero spend, including a session total", () => {
    expect(computeUniformHiddenColumns([logEntry(), logEntry({ spend: 0.0001 })]).spend).toBe(true);
    expect(computeUniformHiddenColumns([logEntry({ spend: 0, session_total_spend: 0.5 })]).spend).toBe(true);
  });

  it("treats undefined spend and missing status as uniform", () => {
    const rows = [logEntry({ spend: undefined as unknown as number, metadata: undefined })];
    expect(computeUniformHiddenColumns(rows)).toEqual({ type: false, status: false, spend: false });
  });
});

describe("parseColumnOverrides", () => {
  it("returns an empty override set for missing, malformed or non-boolean input", () => {
    expect(parseColumnOverrides(null)).toEqual({});
    expect(parseColumnOverrides("not json")).toEqual({});
    expect(parseColumnOverrides('{"status":"yes"}')).toEqual({});
    expect(parseColumnOverrides("[true]")).toEqual({});
  });

  it("keeps a well-formed boolean map", () => {
    expect(parseColumnOverrides('{"status":true,"type":false}')).toEqual({ status: true, type: false });
  });
});

describe("useLogColumnVisibility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lets a user override win over the uniform default and persists it under a single key", () => {
    const rows = [logEntry()];
    const { result } = renderHook(() => useLogColumnVisibility(rows));
    expect(result.current.columnVisibility.status).toBe(false);

    act(() => result.current.setColumnVisible("status", true));

    expect(result.current.columnVisibility.status).toBe(true);
    expect(localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)).toBe(JSON.stringify({ status: true }));
    expect(localStorage.length).toBe(1);
  });

  it("restores persisted overrides for a fresh hook instance", () => {
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify({ spend: true }));

    const { result } = renderHook(() => useLogColumnVisibility([logEntry()]));

    expect(result.current.columnVisibility.spend).toBe(true);
    expect(result.current.columnVisibility.status).toBe(false);
  });

  it("recomputes the uniform defaults when the rows change but keeps overrides", () => {
    const { result, rerender } = renderHook(({ rows }) => useLogColumnVisibility(rows), {
      initialProps: { rows: [logEntry()] },
    });
    act(() => result.current.setColumnVisible("type", true));

    rerender({ rows: [logEntry({ metadata: { status: "failure" } })] });

    expect(result.current.columnVisibility).toEqual({ type: true, status: true, spend: false });
  });
});
