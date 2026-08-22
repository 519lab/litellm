import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette, isRequestIdQuery, paletteResults, type PaletteEntry } from "./CommandPalette";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/utils/migratedPages", () => ({ migratedHref: (seg: string) => `/ui/${seg}` }));

const entries: readonly PaletteEntry[] = [
  { key: "logs", label: "Logs", section: "Gateway", href: "/ui/logs" },
  { key: "usage", label: "Usage", section: "Gateway", href: "/ui/usage" },
  { key: "teams", label: "Teams", section: "More", href: "/ui/teams" },
  { key: "docs", label: "Learning Resources", section: "More", href: "https://example.com", external: true },
];

describe("paletteResults", () => {
  it("matches on label and section, case-insensitively", () => {
    expect(paletteResults(entries, "TEAM").map((e) => e.key)).toEqual(["teams"]);
    expect(paletteResults(entries, "more").map((e) => e.key)).toEqual(["teams", "docs"]);
  });

  it("prepends a request lookup only for request-id-shaped queries", () => {
    expect(isRequestIdQuery("logs")).toBe(false);
    expect(isRequestIdQuery("chatcmpl-HqiYl6IspkDd2tepARO7")).toBe(true);
    const [first] = paletteResults(entries, "chatcmpl-HqiYl6IspkDd2tepARO7");
    expect(first.href).toBe("/ui/logs?request_id=chatcmpl-HqiYl6IspkDd2tepARO7");
  });

  it("caps the result list", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      key: `k${i}`,
      label: `Page ${i}`,
      section: "More",
      href: `/ui/p${i}`,
    }));
    expect(paletteResults(many, "")).toHaveLength(12);
  });
});

describe("CommandPalette", () => {
  beforeEach(() => push.mockReset());

  it("navigates to the highlighted entry with the keyboard", () => {
    render(<CommandPalette open onOpenChange={vi.fn()} entries={entries} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "usa" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/ui/usage");
  });

  it("moves the highlight with arrow keys and wraps", () => {
    render(<CommandPalette open onOpenChange={vi.fn()} entries={entries} />);
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: /Learning Resources/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /Logs/ })).toHaveAttribute("aria-selected", "true");
  });

  it("opens a pasted request id in the logs view", () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} entries={entries} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "chatcmpl-HqiYl6IspkDd2tepARO7" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/ui/logs?request_id=chatcmpl-HqiYl6IspkDd2tepARO7");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows an empty state when nothing matches", () => {
    render(<CommandPalette open onOpenChange={vi.fn()} entries={entries} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzzz" } });
    expect(screen.getByText("No matching pages")).toBeInTheDocument();
  });
});
