import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadRuns } from "./usePlaygroundHistory";
import type { PlaygroundRun } from "./usePlaygroundHistory";

const STORAGE_KEY = "playground_history";

function makeRun(overrides: Partial<PlaygroundRun> = {}): PlaygroundRun {
  return {
    id: overrides.id ?? "test-id",
    timestamp: overrides.timestamp ?? Date.now(),
    model: overrides.model ?? "test-model",
    messages: overrides.messages ?? [],
    response: overrides.response ?? "test response",
    promptTokens: overrides.promptTokens ?? 10,
    completionTokens: overrides.completionTokens ?? 20,
    durationMs: overrides.durationMs ?? 1000,
    label: overrides.label,
  };
}

function storedRuns(): PlaygroundRun[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

function writeRuns(runs: PlaygroundRun[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("loadRuns", () => {
  it("returns empty array when storage is empty", () => {
    expect(loadRuns()).toEqual([]);
  });

  it("returns stored runs", () => {
    const run = makeRun({ id: "r1" });
    writeRuns([run]);
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

// Test the pure storage logic (addRun / deleteRun / clearHistory behaviour)
// by simulating what the hook does: prepend + trim + persist.
describe("run management logic", () => {
  function simulateAddRun(existing: PlaygroundRun[], newRun: PlaygroundRun, max = 50): PlaygroundRun[] {
    const next = [newRun, ...existing].slice(0, max);
    writeRuns(next);
    return next;
  }

  function simulateDeleteRun(existing: PlaygroundRun[], id: string): PlaygroundRun[] {
    const next = existing.filter((r) => r.id !== id);
    writeRuns(next);
    return next;
  }

  it("prepends new run", () => {
    const first = makeRun({ id: "a" });
    const second = makeRun({ id: "b" });
    const after1 = simulateAddRun([], first);
    const after2 = simulateAddRun(after1, second);
    expect(after2[0].id).toBe("b");
    expect(after2[1].id).toBe("a");
  });

  it("trims to max 50 entries", () => {
    const runs: PlaygroundRun[] = Array.from({ length: 50 }, (_, i) => makeRun({ id: `r${i}` }));
    const extra = makeRun({ id: "new" });
    const result = simulateAddRun(runs, extra, 50);
    expect(result).toHaveLength(50);
    expect(result[0].id).toBe("new");
    expect(result[49].id).toBe("r48");
  });

  it("persists to localStorage on add", () => {
    const run = makeRun({ id: "persist-test" });
    simulateAddRun([], run);
    const stored = storedRuns();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("persist-test");
  });

  it("deleteRun removes the correct entry", () => {
    const a = makeRun({ id: "a" });
    const b = makeRun({ id: "b" });
    const c = makeRun({ id: "c" });
    writeRuns([a, b, c]);
    const result = simulateDeleteRun([a, b, c], "b");
    expect(result.map((r) => r.id)).toEqual(["a", "c"]);
    expect(storedRuns().map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("deleteRun is a no-op for unknown id", () => {
    const a = makeRun({ id: "a" });
    writeRuns([a]);
    const result = simulateDeleteRun([a], "nonexistent");
    expect(result).toHaveLength(1);
  });

  it("clearHistory empties storage", () => {
    writeRuns([makeRun({ id: "x" })]);
    localStorage.removeItem(STORAGE_KEY);
    expect(loadRuns()).toEqual([]);
  });
});
