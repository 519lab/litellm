import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserFilterSelect, type UserFilterSelectProps } from "./UserFilterSelect";

const OPTIONS = [
  { value: "user-1", label: "Alice (user-1)" },
  { value: "user-2", label: "bob@example.com (user-2)" },
];

const baseProps: UserFilterSelectProps = {
  value: null,
  onChange: vi.fn(),
  options: OPTIONS,
  onSearchChange: vi.fn(),
  isLoading: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  onLoadMore: vi.fn(),
};

describe("UserFilterSelect", () => {
  it("shows the selected user's label in the field", () => {
    render(<UserFilterSelect {...baseProps} value="user-2" />);

    expect(screen.getByRole("combobox", { name: "Filter by user" })).toHaveValue("bob@example.com (user-2)");
  });

  it("forwards typed text to the server-side search without filtering locally", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<UserFilterSelect {...baseProps} onSearchChange={onSearchChange} />);

    const input = screen.getByRole("combobox", { name: "Filter by user" });
    await user.click(input);
    await user.type(input, "zz");

    expect(onSearchChange).toHaveBeenLastCalledWith("zz");
    expect(await screen.findByText("Alice (user-1)")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com (user-2)")).toBeInTheDocument();
  });

  it("reports the chosen user id and null when cleared", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<UserFilterSelect {...baseProps} onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Filter by user" }));
    await user.click(await screen.findByText("Alice (user-1)"));
    expect(onChange).toHaveBeenCalledWith("user-1");

    rerender(<UserFilterSelect {...baseProps} onChange={onChange} value="user-1" />);
    const clear = document.querySelector('[data-slot="combobox-clear"]');
    if (!(clear instanceof HTMLElement)) throw new Error("clear control not rendered");
    await user.click(clear);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("shows a loading message in the empty list while users load", async () => {
    const user = userEvent.setup();
    render(<UserFilterSelect {...baseProps} options={[]} isLoading={true} />);

    await user.click(screen.getByRole("combobox", { name: "Filter by user" }));

    expect(await screen.findByText("Loading users…")).toBeInTheDocument();
  });
});
