import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadRuns, usePlaygroundHistory } from "./usePlaygroundHistory";
import type { PlaygroundRun } from "./usePlaygroundHistory";

const STORAGE_KEY = "playground_history";

function makeRun(overrides: Partial<Omit<PlaygroundRun, "id" | "timestamp">> = {}): Omit<PlaygroundRun, "id" | "timestamp"> {
  return {
    model: overrides.model ?? "test-model",
    messages: overrides.messages ?? [],
    response: overrides.response ?? "test response",
    promptTokens: overrides.promptTokens ?? 10,
    completionTokens: overrides.completionTokens ?? 20,
    durationMs: overrides.durationMs ?? 1000,
    label: overrides.label,
  };
}

function storedIds(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as PlaygroundRun[]).map((r) => r.id);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("loadRuns", () => {
  it("returns empty array when storage is empty", () => {
    expect(loadRuns()).toEqual([]);
  });

  it("returns stored runs", () => {
    const run: PlaygroundRun = { ...makeRun(), id: "r1", timestamp: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([run]));
    const result = loadRuns();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
  });

  it("returns empty array when storage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{");
    expect(loadRuns()).toEqual([]);
  });

  it("returns empty array when stored value is not an array", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "an array" }));
    expect(loadRuns()).toEqual([]);
  });
});

describe("usePlaygroundHistory", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => usePlaygroundHistory());
    expect(result.current.runs).toEqual([]);
  });

  it("addRun prepends and persists to localStorage", () => {
    const { result } = renderHook(() => usePlaygroundHistory());

    let first: PlaygroundRun;
    let second: PlaygroundRun;
    act(() => { first = result.current.addRun(makeRun({ model: "a" })); });
    act(() => { second = result.current.addRun(makeRun({ model: "b" })); });

    expect(result.current.runs[0].model).toBe("b");
    expect(result.current.runs[1].model).toBe("a");
    expect(storedIds()).toEqual([second!.id, first!.id]);
  });

  it("addRun assigns a unique id and timestamp", () => {
    const { result } = renderHook(() => usePlaygroundHistory());
    let run: PlaygroundRun;
    act(() => { run = result.current.addRun(makeRun()); });
    expect(typeof run!.id).toBe("string");
    expect(run!.id.length).toBeGreaterThan(0);
    expect(typeof run!.timestamp).toBe("number");
    expect(run!.timestamp).toBeGreaterThan(0);
  });

  it("addRun trims to 50 entries", () => {
    const { result } = renderHook(() => usePlaygroundHistory());

    act(() => {
      for (let i = 0; i < 51; i++) {
        result.current.addRun(makeRun({ model: `m${i}` }));
      }
    });

    expect(result.current.runs).toHaveLength(50);
    expect(result.current.runs[0].model).toBe("m50");
  });

  it("deleteRun removes the correct entry by id", () => {
    const { result } = renderHook(() => usePlaygroundHistory());
    let a: PlaygroundRun, b: PlaygroundRun, c: PlaygroundRun;
    act(() => { a = result.current.addRun(makeRun({ model: "a" })); });
    act(() => { b = result.current.addRun(makeRun({ model: "b" })); });
    act(() => { c = result.current.addRun(makeRun({ model: "c" })); });

    act(() => { result.current.deleteRun(b!.id); });

    const ids = result.current.runs.map((r) => r.id);
    expect(ids).not.toContain(b!.id);
    expect(ids).toContain(a!.id);
    expect(ids).toContain(c!.id);
    expect(storedIds()).not.toContain(b!.id);
  });

  it("deleteRun is a no-op for unknown id", () => {
    const { result } = renderHook(() => usePlaygroundHistory());
    act(() => { result.current.addRun(makeRun()); });
    const countBefore = result.current.runs.length;
    act(() => { result.current.deleteRun("nonexistent"); });
    expect(result.current.runs).toHaveLength(countBefore);
  });

  it("clearHistory empties state and removes localStorage key", () => {
    const { result } = renderHook(() => usePlaygroundHistory());
    act(() => { result.current.addRun(makeRun()); });
    act(() => { result.current.clearHistory(); });

    expect(result.current.runs).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("hydrates from existing localStorage on mount", () => {
    const existing: PlaygroundRun = { ...makeRun(), id: "existing", timestamp: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([existing]));

    const { result } = renderHook(() => usePlaygroundHistory());

    act(() => {});
    expect(result.current.runs).toHaveLength(1);
    expect(result.current.runs[0].id).toBe("existing");
  });
});
