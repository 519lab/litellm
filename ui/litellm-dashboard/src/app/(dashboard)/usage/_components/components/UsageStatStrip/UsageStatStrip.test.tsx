import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { readUsageTotals, UsageStatStrip, type UsageTotals } from "./UsageStatStrip";

const TOTALS: UsageTotals = {
  spend: 125.75,
  requests: 1500,
  successfulRequests: 1450,
  failedRequests: 50,
  tokens: 75000,
  promptTokens: 45000,
  completionTokens: 30000,
  cacheReadTokens: 1000,
  cacheWriteTokens: 200,
};

const EMPTY_TOTALS: UsageTotals = {
  ...TOTALS,
  spend: 0,
  requests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  tokens: 0,
};

const RANGE = { from: new Date(2026, 7, 15), to: new Date(2026, 7, 22) };

const renderReady = (totals: UsageTotals, maxBudget: number | null = null) =>
  render(
    <UsageStatStrip
      status={{ kind: "ready" }}
      totals={totals}
      maxBudget={maxBudget}
      dateRange={RANGE}
      onRetry={vi.fn()}
    />,
  );

describe("UsageStatStrip", () => {
  it("shows a skeleton while loading and no stats", () => {
    render(
      <UsageStatStrip
        status={{ kind: "loading" }}
        totals={TOTALS}
        maxBudget={null}
        dateRange={RANGE}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("status", { name: "Loading usage summary" })).toBeInTheDocument();
    expect(screen.queryByText("Total Requests")).not.toBeInTheDocument();
    expect(screen.queryByText("1,500")).not.toBeInTheDocument();
  });

  it("shows the error message with a retry action", async () => {
    const onRetry = vi.fn();
    render(
      <UsageStatStrip
        status={{ kind: "error", message: "boom" }}
        totals={TOTALS}
        maxBudget={null}
        dateRange={RANGE}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load usage summary: boom");
    await userEvent.setup().click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Total Requests")).not.toBeInTheDocument();
  });

  it("shows an empty message when there is no usage in the range", () => {
    renderReady(EMPTY_TOTALS);

    expect(screen.getByText("No usage in this range")).toBeInTheDocument();
    expect(screen.queryByText("Total Requests")).not.toBeInTheDocument();
  });

  it("renders cost stats with tabular values when spend is above zero", () => {
    renderReady(TOTALS, 50);

    const summary = screen.getByLabelText("Usage summary");
    expect(within(summary).getByText("Period")).toBeInTheDocument();
    expect(within(summary).getByText("Aug 15 – Aug 22, 2026")).toBeInTheDocument();
    expect(within(summary).getByText("Total Spend")).toBeInTheDocument();
    expect(within(summary).getByText("$125.7500")).toHaveClass("tabular-nums");
    expect(within(summary).getByText("Max Budget")).toBeInTheDocument();
    expect(within(summary).getByText("$50.0000 limit")).toBeInTheDocument();
    expect(within(summary).getByText("Avg Cost / Request")).toBeInTheDocument();
    expect(within(summary).getByText("$0.0838")).toBeInTheDocument();
    expect(within(summary).getByText("1,500")).toBeInTheDocument();
    expect(within(summary).getByText("1,450")).toBeInTheDocument();
    expect(within(summary).getByText("75,000")).toBeInTheDocument();
  });

  it("shows No limit when there is no max budget", () => {
    renderReady(TOTALS, null);

    expect(screen.getByText("No limit")).toBeInTheDocument();
  });

  it("hides cost stats when spend is zero but keeps request and token counts", () => {
    renderReady({ ...TOTALS, spend: 0 });

    const summary = screen.getByLabelText("Usage summary");
    expect(within(summary).queryByText("Total Spend")).not.toBeInTheDocument();
    expect(within(summary).queryByText("Avg Cost / Request")).not.toBeInTheDocument();
    expect(within(summary).queryByText("Max Budget")).not.toBeInTheDocument();
    expect(within(summary).getByText("Total Requests")).toBeInTheDocument();
    expect(within(summary).getByText("Total Tokens")).toBeInTheDocument();
    expect(within(summary).getByText("75,000")).toBeInTheDocument();
  });

  it("marks failed requests with a non-color indicator only when there are failures", () => {
    const { unmount } = renderReady(TOTALS);

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Has failures" })).toBeInTheDocument();
    expect(screen.getByText("50").className).not.toMatch(/text-red/);
    unmount();

    renderReady({ ...TOTALS, failedRequests: 0 });
    expect(screen.queryByRole("img", { name: "Has failures" })).not.toBeInTheDocument();
  });

  it("toggles the token breakdown from the Total Tokens stat", async () => {
    const user = userEvent.setup();
    renderReady(TOTALS);

    const toggle = screen.getByRole("button", { name: "75,000" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Input Tokens")).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Input Tokens")).toBeInTheDocument();
    expect(screen.getByText("45,000")).toBeInTheDocument();
    expect(screen.getByText("Cache Write Tokens")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });
});

describe("readUsageTotals", () => {
  it("maps metadata fields and treats missing or non-numeric values as zero", () => {
    const metadata = {
      total_spend: 1.5,
      total_api_requests: "7",
      total_tokens: Number.NaN,
      total_failed_requests: 2,
    };
    const expected: UsageTotals = {
      spend: 1.5,
      requests: 0,
      successfulRequests: 0,
      failedRequests: 2,
      tokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };

    expect(readUsageTotals(metadata)).toEqual(expected);
  });
});
