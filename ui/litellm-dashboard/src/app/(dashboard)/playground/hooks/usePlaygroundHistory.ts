"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type PlaygroundRun = {
  id: string;
  timestamp: number;
  model: string;
  messages: Array<{ role: string; content: string }>;
  response: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  label?: string;
};

const STORAGE_KEY = "playground_history";
const MAX_RUNS = 50;

export function loadRuns(): PlaygroundRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PlaygroundRun[];
  } catch {
    return [];
  }
}

function saveRuns(runs: PlaygroundRun[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    // storage full or unavailable — silently skip
  }
}

export function usePlaygroundHistory() {
  const [runs, setRuns] = useState<PlaygroundRun[]>([]);

  useEffect(() => {
    setRuns(loadRuns());
  }, []);

  function addRun(run: Omit<PlaygroundRun, "id" | "timestamp">): PlaygroundRun {
    const entry: PlaygroundRun = { ...run, id: uuidv4(), timestamp: Date.now() };
    setRuns((prev) => {
      const next = [entry, ...prev].slice(0, MAX_RUNS);
      saveRuns(next);
      return next;
    });
    return entry;
  }

  function deleteRun(id: string): void {
    setRuns((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRuns(next);
      return next;
    });
  }

  function clearHistory(): void {
    setRuns([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return { runs, addRun, deleteRun, clearHistory };
}
