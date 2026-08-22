import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DashboardHeader } from "./DashboardHeader";

const { mockUsePluginMode, mockUseUISettings, state } = vi.hoisted(() => {
  const state = {
    plugins: [] as { name: string; display_name: string; url: string }[],
    enableChatUI: false,
  };
  return {
    state,
    mockUsePluginMode: vi.fn(() => ({ mode: "ai-gateway", setMode: vi.fn(), plugins: state.plugins })),
    mockUseUISettings: vi.fn(() => ({ data: { values: { enable_chat_ui: state.enableChatUI } } })),
  };
});

vi.mock("@/contexts/PluginModeContext", () => ({ usePluginMode: mockUsePluginMode }));
vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({ useUISettings: mockUseUISettings }));
vi.mock("next/navigation", () => ({ usePathname: () => "/ui/", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/utils/migratedPages", () => ({ migratedHref: (seg: string) => `/ui/${seg}` }));
vi.mock("@/hooks/useWorker", () => ({ useWorker: () => ({ isControlPlane: false, selectedWorker: null }) }));
vi.mock("@/components/Navbar/NotificationsBell/NotificationsBell", () => ({ NotificationsBell: () => null }));
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => ({ userRole: "Admin" }) }));
vi.mock("@/components/leftnav", () => ({
  getBreadcrumb: (page: string) => ({ section: "Gateway", title: page === "logs" ? "Logs" : page }),
  navEntriesForRole: () => [{ key: "logs", label: "Logs", section: "Gateway", href: "/ui/logs" }],
}));
vi.mock("@/components/Navbar/WorkerDropdown/WorkerDropdown", () => ({ default: () => null }));

describe("DashboardHeader breadcrumb", () => {
  afterEach(() => {
    state.plugins = [];
    state.enableChatUI = false;
  });

  it("roots the breadcrumb in the AI Gateway selector (with a Chat option) and drops the static section crumb when the selector is available", async () => {
    state.enableChatUI = true;
    render(<DashboardHeader page="logs" />);

    expect(screen.getByText("Logs")).toBeInTheDocument();
    expect(screen.queryByText("Observability")).not.toBeInTheDocument();

    const selector = screen.getByRole("button", { name: /AI Gateway/i });
    act(() => {
      fireEvent.click(selector);
    });
    await waitFor(() => expect(screen.getByText("Chat")).toBeInTheDocument());
  });

  it("carries no marketing links (Docs, Blog, community) in the top bar", () => {
    render(<DashboardHeader page="logs" />);

    expect(screen.queryByRole("link", { name: /docs/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/blog/i)).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="slack"], a[href*="github.com"]')).toBeNull();
  });

  it("keeps the AI Gateway selector at the root even when there is nothing to switch to (discovery)", () => {
    render(<DashboardHeader page="logs" />);

    expect(screen.getByRole("button", { name: /AI Gateway/i })).toBeInTheDocument();
    expect(screen.getByText("Logs")).toBeInTheDocument();
    expect(screen.queryByText("Observability")).not.toBeInTheDocument();
  });

  it("opens the command palette from the Search button and with Ctrl+K", async () => {
    render(<DashboardHeader page="logs" />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /search pages/i }));
    });
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());

    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    await waitFor(() => expect(screen.queryByRole("combobox")).not.toBeInTheDocument());
  });
});
