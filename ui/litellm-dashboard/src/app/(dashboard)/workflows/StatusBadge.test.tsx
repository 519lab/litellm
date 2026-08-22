import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge";
import type { RunStatus } from "./types";

const CASES: readonly [RunStatus, string, string][] = [
  ["completed", "outline", "lucide-check"],
  ["failed", "destructive", "lucide-circle-alert"],
  ["running", "secondary", "lucide-loader-circle"],
  ["pending", "secondary", "lucide-clock"],
  ["paused", "secondary", "lucide-pause"],
];

describe("StatusBadge", () => {
  it.each(CASES)("renders %s with the %s variant and a %s icon", (status, variant, iconClass) => {
    const { container } = render(<StatusBadge status={status} />);
    const badge = container.querySelector('[data-slot="badge"]');

    expect(badge).toHaveAttribute("data-variant", variant);
    expect(badge).toHaveTextContent(status);
    expect(badge?.querySelector(`svg.${iconClass}`)).not.toBeNull();
  });

  it("spins only the running icon", () => {
    const running = render(<StatusBadge status="running" />).container.querySelector("svg");
    const completed = render(<StatusBadge status="completed" />).container.querySelector("svg");

    expect(running).toHaveClass("animate-spin");
    expect(completed).not.toHaveClass("animate-spin");
  });

  it("shows the given label while keeping the variant of the underlying status", () => {
    const { container, getByText } = render(<StatusBadge status="completed" label="done" />);

    expect(getByText("done")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="badge"]')).toHaveAttribute("data-variant", "outline");
  });

  it("falls back to the pending presentation for an unknown status", () => {
    const { container } = render(<StatusBadge status={"weird" as RunStatus} />);

    expect(container.querySelector('[data-slot="badge"]')).toHaveAttribute("data-variant", "secondary");
    expect(container.querySelector("svg.lucide-clock")).not.toBeNull();
  });
});
