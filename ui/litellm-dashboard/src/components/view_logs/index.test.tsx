import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import moment from "moment";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SpendLogsTable from "./index";
import { renderWithProviders } from "../../../tests/test-utils";
import { uiSpendLogsCall } from "../networking";
import { useLogFilterLogic, type LogFilterState } from "./log_filter_logic";

const mockHandleFilterResetFromHook = vi.fn();
vi.mock("./log_filter_logic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./log_filter_logic")>();
  return {
    ...actual,
    useLogFilterLogic: vi.fn(
      ({ setFilters }: { setFilters: React.Dispatch<React.SetStateAction<LogFilterState>> }) => ({
        logsQuery: { isLoading: false, isFetching: false, refetch: vi.fn() },
        filteredLogs: { data: [], total: 0, page: 1, page_size: 50, total_pages: 1 },
        allTeams: [],
        handleFilterChange: (next: Partial<LogFilterState>) => setFilters((prev) => ({ ...prev, ...next })),
        handleFilterReset: mockHandleFilterResetFromHook,
      }),
    ),
  };
});

vi.mock("./filter_options", () => ({
  getLogFilterOptions: () => [{ name: "Key Hash", label: "Key Hash", isSearchable: false }],
}));

vi.mock("../networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../networking")>();
  return {
    ...actual,
    uiSpendLogsCall: vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      page_size: 50,
      total_pages: 0,
    }),
    keyListCall: vi.fn().mockResolvedValue({ keys: [] }),
    keyInfoV1Call: vi.fn().mockResolvedValue({ info: {} }),
    allEndUsersCall: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("../key_team_helpers/filter_helpers", () => ({
  fetchAllTeams: vi.fn().mockResolvedValue([]),
}));

describe("SpendLogsTable", () => {
  const defaultProps = {
    accessToken: "test-token",
    token: "test-token",
    userRole: "Admin",
    userID: "user-1",
    premiumUser: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  const applyKeyHashFilter = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /^Filters/ }));
    await user.type(screen.getByLabelText("Key Hash"), "sk-abc");
  };

  it("hides Reset until a filter is active, then shows the active count on the Filters button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpendLogsTable {...defaultProps} />);

    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();

    await applyKeyHashFilter(user);

    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filters/ })).toHaveTextContent("1");
  });

  it("calls handleFilterResetFromHook when Reset is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpendLogsTable {...defaultProps} />);

    await applyKeyHashFilter(user);
    await user.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(mockHandleFilterResetFromHook).toHaveBeenCalledTimes(1);
    });
  });

  it("resets a custom date range back to the quick default when Reset is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpendLogsTable {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Last 24 Hours/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Custom Range" }));

    expect(screen.getByLabelText("Start time")).toBeInTheDocument();
    expect(screen.getByLabelText("End time")).toBeInTheDocument();

    await applyKeyHashFilter(user);
    await user.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(mockHandleFilterResetFromHook).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByLabelText("Start time")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Last 24 Hours/i })).toBeInTheDocument();
  });

  it("renders a single toolbar row with no Fetch button and no auto-refresh banner", () => {
    renderWithProviders(<SpendLogsTable {...defaultProps} />);

    expect(screen.queryByRole("heading", { name: "Request Logs" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Fetch/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Auto-refreshing/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Live tail/ })).toBeInTheDocument();
  });

  describe("auth-not-ready guard", () => {
    it("shows a loading spinner when credentials are not yet resolved", () => {
      renderWithProviders(<SpendLogsTable {...defaultProps} accessToken={null} />);

      expect(document.querySelector(".ant-spin")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Filters/ })).not.toBeInTheDocument();
    });

    it("renders the table (no spinner) once all credentials are present", () => {
      renderWithProviders(<SpendLogsTable {...defaultProps} />);

      expect(document.querySelector(".ant-spin")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
    });
  });

  describe("Quick Select time range", () => {
    beforeEach(async () => {
      const actual = await vi.importActual<typeof import("./log_filter_logic")>("./log_filter_logic");
      vi.mocked(useLogFilterLogic).mockImplementation(actual.useLogFilterLogic);
    });

    const waitForWindowSeconds = async (minMinutes: number) => {
      await waitFor(() => {
        const lastCall = vi.mocked(uiSpendLogsCall).mock.calls.at(-1)?.[0];
        if (!lastCall) throw new Error("uiSpendLogsCall was not called");
        const diff = moment
          .utc(lastCall.end_date, "YYYY-MM-DD HH:mm:ss")
          .diff(moment.utc(lastCall.start_date, "YYYY-MM-DD HH:mm:ss"), "seconds");
        expect(diff).toBeGreaterThanOrEqual(minMinutes * 60);
        expect(diff).toBeLessThanOrEqual((minMinutes + 1) * 60);
      });
    };

    it("should pass a ~1-minute window to uiSpendLogsCall when 'Last Minute' is selected", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SpendLogsTable {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /Last 24 Hours/i }));
      await user.click(await screen.findByRole("menuitem", { name: "Last Minute" }));

      await waitForWindowSeconds(1);
    });

    it("should pass a ~15-minute window to uiSpendLogsCall when 'Last 15 Minutes' is selected", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SpendLogsTable {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /Last 24 Hours/i }));
      await user.click(await screen.findByRole("menuitem", { name: "Last 15 Minutes" }));

      await waitForWindowSeconds(15);
    });

    it("should update the time-range button label to 'Last Minute' after selecting it", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SpendLogsTable {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /Last 24 Hours/i }));
      await user.click(await screen.findByRole("menuitem", { name: "Last Minute" }));

      expect(screen.getByRole("button", { name: "Last Minute" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Last 24 Hours/i })).not.toBeInTheDocument();
    });
  });
});
