import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DrawerHeader } from "./DrawerHeader";
import { LogEntry } from "../columns";

const log: LogEntry = {
  request_id: "chatcmpl-abc123",
  api_key: "",
  team_id: "",
  model: "gpt-4o",
  model_id: "",
  call_type: "acompletion",
  spend: 0,
  total_tokens: 0,
  prompt_tokens: 0,
  completion_tokens: 0,
  startTime: "2026-07-08T10:00:00.000Z",
  endTime: "2026-07-08T10:00:01.000Z",
  cache_hit: "false",
  messages: [],
  response: {},
  custom_llm_provider: "openai",
};

const renderHeader = (overrides: Partial<React.ComponentProps<typeof DrawerHeader>> = {}) => {
  const handlers = { onClose: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn() };
  render(<DrawerHeader log={log} status="success" {...handlers} {...overrides} />);
  return handlers;
};

describe("DrawerHeader", () => {
  it("renders the model as the title, the provider as muted text and the request id in mono with a copy button", () => {
    renderHeader();

    expect(screen.getByRole("heading", { name: "gpt-4o" })).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toHaveClass("text-muted-foreground");
    expect(screen.getByText("chatcmpl-abc123")).toHaveClass("font-mono");
    expect(screen.getByRole("button", { name: "Copy request ID" })).toBeInTheDocument();
  });

  it("shows a success badge with a check icon", () => {
    renderHeader({ status: "success" });

    const badge = screen.getByText("Success");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveAttribute("data-variant", "outline");
    expect(badge.querySelector(".lucide-check")).not.toBeNull();
    expect(badge.querySelector(".lucide-circle-alert")).toBeNull();
  });

  it("shows a destructive failure badge with an alert icon", () => {
    renderHeader({ status: "failure" });

    const badge = screen.getByText("Failure");
    expect(badge).toHaveAttribute("data-variant", "destructive");
    expect(badge.querySelector(".lucide-circle-alert")).not.toBeNull();
    expect(badge.querySelector(".lucide-check")).toBeNull();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  it("renders the env badge only when an environment is set", () => {
    const { unmount } = render(
      <DrawerHeader log={log} status="success" onClose={vi.fn()} onPrevious={vi.fn()} onNext={vi.fn()} />,
    );
    expect(screen.queryByText(/^Env:/)).not.toBeInTheDocument();
    unmount();

    renderHeader({ environment: "staging" });
    expect(screen.getByText("Env: staging")).toHaveAttribute("data-slot", "badge");
  });

  it("renders a relative timestamp whose title holds the absolute time", () => {
    renderHeader();

    const time = screen.getByText(/ago$/);
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", log.startTime);
    expect(time).toHaveAttribute("title", expect.stringMatching(/Jul 8, 2026/));
  });

  it("exposes prev/next/close as labelled buttons with K/J key hints and wires the callbacks", async () => {
    const user = userEvent.setup();
    const handlers = renderHeader();

    const previous = screen.getByRole("button", { name: "Previous log (K)" });
    const next = screen.getByRole("button", { name: "Next log (J)" });
    expect(previous.querySelector("kbd")).toHaveTextContent("K");
    expect(next.querySelector("kbd")).toHaveTextContent("J");

    await user.click(previous);
    await user.click(next);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(handlers.onPrevious).toHaveBeenCalledTimes(1);
    expect(handlers.onNext).toHaveBeenCalledTimes(1);
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });
});
