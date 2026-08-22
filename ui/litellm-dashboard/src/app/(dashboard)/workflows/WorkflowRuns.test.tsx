import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import WorkflowRuns from "./WorkflowRuns";

vi.mock("@/components/networking", () => ({
  proxyBaseUrl: "",
  getGlobalLitellmHeaderName: () => "x-litellm-api-key",
}));

interface FakeRun {
  run_id: string;
  status: string;
  workflow_type: string;
  created_at: string;
  metadata: { title?: string; state?: string } | null;
}

const RUNS: FakeRun[] = [
  {
    run_id: "run-aaaaaaaa-1111",
    status: "completed",
    workflow_type: "grill",
    created_at: "2026-01-01T00:00:00Z",
    metadata: { title: "First run", state: "done" },
  },
  {
    run_id: "run-bbbbbbbb-2222",
    status: "running",
    workflow_type: "autofix",
    created_at: "2026-01-02T00:00:00Z",
    metadata: null,
  },
];

function okJson(body: unknown) {
  return Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) });
}

function mockFetch(runs: FakeRun[]) {
  return vi.fn((url: string, _init?: RequestInit) => {
    if (url.includes("/runs?limit")) return okJson({ runs });
    if (url.includes("/events")) return okJson({ events: [] });
    if (url.includes("/messages")) return okJson({ messages: [] });
    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve("{}") });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorkflowRuns", () => {
  it("renders one DataTable row per fetched run", async () => {
    vi.stubGlobal("fetch", mockFetch(RUNS));
    const { container } = render(<WorkflowRuns accessToken="tok" />);

    expect(await screen.findByText("First run")).toBeInTheDocument();
    expect(container.querySelectorAll("tr[data-row-id]")).toHaveLength(2);
  });

  it("shows a skeleton loading state while the run list is in flight", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<WorkflowRuns accessToken="tok" />);

    expect(screen.getByText("Loading workflow runs…")).toBeInTheDocument();
    expect(screen.queryByText("No workflow runs yet")).not.toBeInTheDocument();
  });

  it("opens the detail sheet for the clicked run by firing its detail fetch", async () => {
    const user = userEvent.setup();
    const fetchSpy = mockFetch(RUNS);
    vi.stubGlobal("fetch", fetchSpy);
    render(<WorkflowRuns accessToken="tok" />);

    await user.click(await screen.findByText("First run"));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("run-aaaaaaaa-1111/events"), expect.anything()),
    );
    const dialog = await screen.findByRole("dialog", { name: "Run details" });
    expect(within(dialog).getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(await within(dialog).findByText("No events recorded")).toBeInTheDocument();
  });

  it("exposes each run as a keyboard-reachable button that opens the detail sheet", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetch(RUNS));
    render(<WorkflowRuns accessToken="tok" />);

    const rowButton = await screen.findByRole("button", { name: /First run/ });
    rowButton.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("dialog", { name: "Run details" })).toBeInTheDocument();
  });

  it("closes the detail sheet with Escape", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", mockFetch(RUNS));
    render(<WorkflowRuns accessToken="tok" />);

    await user.click(await screen.findByText("First run"));
    const dialog = await screen.findByRole("dialog", { name: "Run details" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(document.activeElement ?? window, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Run details" })).not.toBeInTheDocument());
  });

  it("shows the empty state when there are no runs", async () => {
    vi.stubGlobal("fetch", mockFetch([]));
    render(<WorkflowRuns accessToken="tok" />);

    expect(await screen.findByText("No workflow runs yet")).toBeInTheDocument();
    expect(screen.getByText("Runs appear here once an agent or workflow starts.")).toBeInTheDocument();
  });

  it("sends the configured litellm key header on every fetch instead of hardcoding Authorization", async () => {
    const user = userEvent.setup();
    const fetchSpy = mockFetch(RUNS);
    vi.stubGlobal("fetch", fetchSpy);
    render(<WorkflowRuns accessToken="tok" />);

    await user.click(await screen.findByText("First run"));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
    for (const [url, init] of fetchSpy.mock.calls) {
      expect(init?.headers, url).toMatchObject({ "x-litellm-api-key": "Bearer tok" });
      expect(init?.headers, url).not.toHaveProperty("Authorization");
    }
  });
});
