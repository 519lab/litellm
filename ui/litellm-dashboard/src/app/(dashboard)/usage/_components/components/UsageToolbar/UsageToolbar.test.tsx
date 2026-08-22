import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UsageToolbar, type UsageToolbarProps } from "./UsageToolbar";

vi.mock("@/components/shared/advanced_date_picker", async () => {
  const React = await import("react");
  const AdvancedDatePicker = ({ label }: { label?: string }) =>
    React.createElement("div", { "data-testid": "advanced-date-picker" }, label);
  return { default: AdvancedDatePicker };
});

const baseProps: UsageToolbarProps = {
  view: { value: "global", onChange: vi.fn(), isAdmin: true, canViewTagUsage: true },
  userFilter: {
    value: null,
    onChange: vi.fn(),
    options: [{ value: "user-1", label: "Alice (user-1)" }],
    onSearchChange: vi.fn(),
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: vi.fn(),
  },
  dateRange: { from: new Date(2026, 7, 15), to: new Date(2026, 7, 22) },
  onDateRangeChange: vi.fn(),
};

describe("UsageToolbar", () => {
  it("renders the view select, user filter and date picker as siblings in one toolbar row", () => {
    render(<UsageToolbar {...baseProps} />);

    const toolbar = screen.getByRole("toolbar", { name: "Usage filters" });
    expect(toolbar).toHaveClass("flex");
    const viewSelect = within(toolbar).getByRole("combobox", { name: "Usage view" });
    const userFilter = within(toolbar).getByRole("combobox", { name: "Filter by user" });
    const datePicker = within(toolbar).getByTestId("advanced-date-picker");
    expect(viewSelect.parentElement).toBe(toolbar);
    expect(userFilter.closest('[role="toolbar"]')).toBe(toolbar);
    expect(datePicker.parentElement?.parentElement).toBe(toolbar);
  });

  it("renders no helper captions", () => {
    render(<UsageToolbar {...baseProps} />);

    expect(screen.queryByText("Usage View")).not.toBeInTheDocument();
    expect(screen.queryByText("Select the usage data you want to view")).not.toBeInTheDocument();
    expect(screen.queryByText("Select Time Range")).not.toBeInTheDocument();
    expect(screen.getByTestId("advanced-date-picker")).toBeEmptyDOMElement();
  });

  it("omits the user filter when it is not applicable to the view", () => {
    render(<UsageToolbar {...baseProps} userFilter={null} />);

    expect(screen.queryByRole("combobox", { name: "Filter by user" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Usage view" })).toBeInTheDocument();
  });
});
