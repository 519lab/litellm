import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LogsToolbar } from "./LogsToolbar";
import type { PaginatedResponse } from "./log_filter_logic";
import { customTimeRange, defaultTimeRange } from "./timeRange";

const results = (overrides: Partial<PaginatedResponse> = {}): PaginatedResponse => ({
  data: [],
  total: 120,
  page: 1,
  page_size: 50,
  total_pages: 3,
  ...overrides,
});

const renderToolbar = (overrides: Partial<React.ComponentProps<typeof LogsToolbar>> = {}) => {
  const props: React.ComponentProps<typeof LogsToolbar> = {
    searchTerm: "",
    onSearchChange: vi.fn(),
    timeRange: defaultTimeRange(),
    onTimeRangeChange: vi.fn(),
    activeFilterCount: 0,
    filtersOpen: false,
    onFiltersOpenChange: vi.fn(),
    onResetFilters: vi.fn(),
    isLiveTail: false,
    onIsLiveTailChange: vi.fn(),
    isFetching: false,
    onRefresh: vi.fn(),
    columns: [
      { id: "status", label: "Status", visible: false },
      { id: "model", label: "Model", visible: true },
    ],
    onColumnVisibleChange: vi.fn(),
    currentPage: 1,
    onPageChange: vi.fn(),
    pageSize: 50,
    isLoading: false,
    results: results(),
    ...overrides,
  };
  render(<LogsToolbar {...props} />);
  return props;
};

describe("LogsToolbar live indicator", () => {
  it("pulses the dot and keeps the Live text when live tail is on and the table is on page 1", () => {
    renderToolbar({ isLiveTail: true });

    const dot = screen.getByTestId("live-indicator");
    expect(dot).toHaveClass("animate-pulse");
    expect(screen.getByRole("switch", { name: /Live tail/ })).toBeChecked();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("does not pulse when live tail is off", () => {
    renderToolbar({ isLiveTail: false });

    expect(screen.getByTestId("live-indicator")).not.toHaveClass("animate-pulse");
    expect(screen.getByRole("switch", { name: /Live tail/ })).not.toBeChecked();
  });

  it("does not pulse on pages other than the first, where polling is paused", () => {
    renderToolbar({ isLiveTail: true, currentPage: 2 });

    expect(screen.getByTestId("live-indicator")).not.toHaveClass("animate-pulse");
  });

  it("reports toggle changes through onIsLiveTailChange", async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ isLiveTail: false });

    await user.click(screen.getByRole("switch", { name: /Live tail/ }));

    expect(props.onIsLiveTailChange).toHaveBeenCalledWith(true);
  });
});

describe("LogsToolbar filters", () => {
  it("hides Reset and the count badge when no filters are active", () => {
    renderToolbar({ activeFilterCount: 0 });

    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filters/ })).toHaveTextContent(/^Filters$/);
  });

  it("shows the active count on the Filters button and a Reset button that calls onResetFilters", async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ activeFilterCount: 2 });

    expect(screen.getByRole("button", { name: /Filters/ })).toHaveTextContent("2");
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(props.onResetFilters).toHaveBeenCalledTimes(1);
  });

  it("toggles the filters panel and exposes its expanded state", async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ filtersOpen: false });

    const filtersButton = screen.getByRole("button", { name: /Filters/ });
    expect(filtersButton).toHaveAttribute("aria-expanded", "false");
    await user.click(filtersButton);

    expect(props.onFiltersOpenChange).toHaveBeenCalledWith(true);
  });
});

describe("LogsToolbar refresh and pagination", () => {
  it("calls onRefresh from the icon button and disables it while fetching", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Fetch/ })).not.toBeInTheDocument();

    renderToolbar({ isFetching: true });
    expect(screen.getAllByRole("button", { name: "Refresh" }).at(-1)).toBeDisabled();
  });

  it("shows the result window and page count, with a plus suffix when the total is capped", () => {
    renderToolbar({ currentPage: 2, results: results({ total: 120, total_pages: 3, total_is_capped: true }) });

    expect(screen.getByText("51–100 of 120+")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3+")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    renderToolbar({ currentPage: 1 });
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    renderToolbar({ currentPage: 3 });
    expect(screen.getAllByRole("button", { name: "Next page" }).at(-1)).toBeDisabled();
  });

  it("moves one page at a time", async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ currentPage: 2 });

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(props.onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(props.onPageChange).toHaveBeenNthCalledWith(2, 1);
  });
});

describe("LogsToolbar columns menu", () => {
  it("lists columns with their visibility and reports toggles", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Columns" }));
    const statusItem = await screen.findByRole("menuitemcheckbox", { name: "Status" });
    expect(statusItem).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menuitemcheckbox", { name: "Model" })).toHaveAttribute("aria-checked", "true");

    await user.click(statusItem);

    expect(props.onColumnVisibleChange).toHaveBeenCalledWith("status", true);
  });
});

describe("LogsToolbar time range", () => {
  it("shows custom start and end inputs only in custom mode", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    expect(screen.queryByLabelText("Start time")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Last 24 Hours" }));
    await user.click(await screen.findByRole("menuitem", { name: "Custom Range" }));

    expect(props.onTimeRangeChange).toHaveBeenCalledWith(expect.objectContaining({ mode: "custom" }));
  });

  it("renders the custom range inputs with the stored values", () => {
    renderToolbar({ timeRange: customTimeRange("2026-01-01T00:00", "2026-01-02T00:00") });

    expect(screen.getByLabelText("Start time")).toHaveValue("2026-01-01T00:00");
    expect(screen.getByLabelText("End time")).toHaveValue("2026-01-02T00:00");
  });
});
