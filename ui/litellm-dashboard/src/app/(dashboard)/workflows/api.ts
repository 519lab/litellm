import { getGlobalLitellmHeaderName, proxyBaseUrl } from "@/components/networking";
import { ApiError, createApiClient } from "@/lib/http/client";
import type { RunDetail, WorkflowRun, WorkflowRunEvent, WorkflowRunMessage } from "./types";

const client = createApiClient({ getBaseUrl: () => proxyBaseUrl ?? "", getAuthHeaderName: getGlobalLitellmHeaderName });

function bySequence<T extends { sequence_number: number }>(a: T, b: T): number {
  return a.sequence_number - b.sequence_number;
}

async function fetchSorted<T extends { sequence_number: number }>(
  accessToken: string,
  path: string,
  key: string,
): Promise<T[]> {
  try {
    const data = await client.get<Record<string, T[] | undefined>>(path, { accessToken });
    return [...(data?.[key] ?? [])].sort(bySequence);
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
}

export async function fetchWorkflowRuns(accessToken: string): Promise<WorkflowRun[]> {
  const data = await client.get<{ runs?: WorkflowRun[] }>("/v1/workflows/runs", { accessToken, query: { limit: 100 } });
  return data?.runs ?? [];
}

export async function fetchRunDetail(accessToken: string, runId: string): Promise<RunDetail> {
  const [events, messages] = await Promise.all([
    fetchSorted<WorkflowRunEvent>(accessToken, `/v1/workflows/runs/${runId}/events`, "events"),
    fetchSorted<WorkflowRunMessage>(accessToken, `/v1/workflows/runs/${runId}/messages`, "messages"),
  ]);
  return { events, messages };
}
