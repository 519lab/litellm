import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TransformRequestPanel from "./TransformRequestPanel";

vi.mock("@/components/networking", () => ({
  transformRequestCall: vi.fn(),
}));

vi.mock("@/components/molecules/notifications_manager", () => ({
  default: { success: vi.fn(), info: vi.fn(), fromBackend: vi.fn() },
}));

describe("TransformRequestPanel", () => {
  it("should render both request panes", () => {
    render(<TransformRequestPanel accessToken="sk-test" />);
    expect(screen.getByText("Original Request")).toBeInTheDocument();
    expect(screen.getByText("Transformed Request")).toBeInTheDocument();
  });

  it("should use the theme card token instead of an inline background colour on both panes", () => {
    render(<TransformRequestPanel accessToken="sk-test" />);

    const panes = [screen.getByTestId("original-request-pane"), screen.getByTestId("transformed-request-pane")];
    panes.forEach((pane) => {
      expect(pane.style.backgroundColor).toBe("");
      expect(pane.style.border).toBe("");
      expect(pane).toHaveClass("bg-card");
    });
  });
});
