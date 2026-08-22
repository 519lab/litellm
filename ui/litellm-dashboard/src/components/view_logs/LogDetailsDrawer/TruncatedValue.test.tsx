import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TruncatedValue } from "./TruncatedValue";

describe("TruncatedValue", () => {
  it("should render the value text", () => {
    render(<TruncatedValue value="chatcmpl-abc123" />);
    expect(screen.getByText("chatcmpl-abc123")).toBeInTheDocument();
  });

  it("should render a dash when value is undefined", () => {
    render(<TruncatedValue />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should render a dash when value is empty string", () => {
    render(<TruncatedValue value="" />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should apply the default max width class when not specified", () => {
    render(<TruncatedValue value="some-long-id-value" />);
    const el = screen.getByText("some-long-id-value");
    expect(el).toHaveClass("max-w-[180px]", "truncate");
    expect(el).toHaveAttribute("title", "some-long-id-value");
  });

  it("should apply a custom max width class when provided", () => {
    render(<TruncatedValue value="test-value" className="max-w-[300px]" />);
    const el = screen.getByText("test-value");
    expect(el).toHaveClass("max-w-[300px]");
    expect(el).not.toHaveClass("max-w-[180px]");
  });

  it("renders a copy button for the value", () => {
    render(<TruncatedValue value="copy-me" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
