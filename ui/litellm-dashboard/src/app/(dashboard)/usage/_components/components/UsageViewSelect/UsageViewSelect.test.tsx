import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsageViewSelect } from "./UsageViewSelect";

describe("UsageViewSelect", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders a labelled select showing the current view without helper captions", () => {
    render(<UsageViewSelect value="global" onChange={mockOnChange} isAdmin={true} />);

    const trigger = screen.getByRole("combobox", { name: "Usage view" });
    expect(trigger).toHaveTextContent("Global Usage");
    expect(screen.queryByText("Usage View")).not.toBeInTheDocument();
    expect(screen.queryByText("Select the usage data you want to view")).not.toBeInTheDocument();
  });

  it("shows the non-admin label for the global view", () => {
    render(<UsageViewSelect value="global" onChange={mockOnChange} isAdmin={false} />);

    expect(screen.getByRole("combobox", { name: "Usage view" })).toHaveTextContent("Your Usage");
  });

  it("calls onChange with the chosen view", async () => {
    const user = userEvent.setup();
    render(<UsageViewSelect value="global" onChange={mockOnChange} isAdmin={true} />);

    await user.click(screen.getByRole("combobox", { name: "Usage view" }));
    await user.click(await screen.findByRole("option", { name: /Team Usage/ }));

    expect(mockOnChange).toHaveBeenCalledWith("team");
  });

  it("shows Tag Usage for non-admin users with tag usage permission", async () => {
    const user = userEvent.setup();
    render(<UsageViewSelect value="global" onChange={mockOnChange} isAdmin={false} canViewTagUsage={true} />);

    await user.click(screen.getByRole("combobox", { name: "Usage view" }));

    expect(await screen.findByRole("option", { name: /Tag Usage/ })).toBeInTheDocument();
  });

  it("hides admin-only views for non-admin users without tag usage permission", async () => {
    const user = userEvent.setup();
    render(<UsageViewSelect value="global" onChange={mockOnChange} isAdmin={false} />);

    await user.click(screen.getByRole("combobox", { name: "Usage view" }));

    expect(await screen.findByRole("option", { name: /Team Usage/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Tag Usage/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Customer Usage/ })).not.toBeInTheDocument();
  });
});
