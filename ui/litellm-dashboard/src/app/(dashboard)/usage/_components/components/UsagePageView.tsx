/**
 * New Usage Page
 *
 * Uses the new `/user/daily/activity` endpoint to get daily activity data for a user.
 *
 * Works at 1m+ spend logs, by querying an aggregate table instead.
 */

import { ExportOutlined, LoadingOutlined } from "@ant-design/icons";
import { useDebouncedState } from "@tanstack/react-pacer/debouncer";
import { DEBOUNCE_WAIT_MS } from "@/utils/debounceConstants";
import { Card, Col, DateRangePickerValue, Grid, Title } from "@tremor/react";
import { Alert, Button, Segmented, Typography } from "antd";
import { Download, Sparkles } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BarChart } from "@/components/shared/charts";
import { Button as UiButton } from "@/components/ui/button";
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAgents } from "@/app/(dashboard)/hooks/agents/useAgents";
import { useCustomers } from "@/app/(dashboard)/hooks/customers/useCustomers";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useCurrentUser } from "@/app/(dashboard)/hooks/users/useCurrentUser";
import { useInfiniteUsers } from "@/app/(dashboard)/hooks/users/useUsers";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { all_admin_roles, internalUserRoles } from "@/utils/roles";
import { ActivityMetrics, processActivityData } from "@/components/activity_metrics";
import CloudZeroExportModal from "@/components/cloudzero_export_modal";
import EntityUsageExportModal from "@/components/EntityUsageExport";
import { Team } from "@/components/key_team_helpers/key_list";
import {
  Organization,
  tagListCall,
  userDailyActivityAggregatedCall,
  userDailyActivityCall,
} from "@/components/networking";
import { ChartLoader } from "@/components/shared/chart_loader";
import { Tag } from "@/components/tag_management/types";
import UserAgentActivity from "@/components/user_agent_activity";
import { usePaginatedDailyActivity } from "../hooks/usePaginatedDailyActivity";
import { DailyData, KeyMetricWithMetadata, MetricWithMetadata } from "@/components/UsagePage/types";
import { valueFormatterSpend } from "@/components/UsagePage/utils/value_formatters";
import EndpointUsage from "./EndpointUsage/EndpointUsage";
import EntityUsage, { EntityList } from "./EntityUsage/EntityUsage";
import SpendByProvider from "./EntityUsage/SpendByProvider";
import TopKeyView from "@/components/UsagePage/components/EntityUsage/TopKeyView";
import UsageAIChatPanel from "./UsageAIChatPanel";
import { readUsageTotals, UsageStatStrip, usageStatStripStatus } from "./UsageStatStrip/UsageStatStrip";
import { UsageToolbar } from "./UsageToolbar/UsageToolbar";
import { UsageOption } from "./UsageViewSelect/UsageViewSelect";

interface UsagePageProps {
  teams: Team[];
  organizations: Organization[];
}

const UsagePage: React.FC<UsagePageProps> = ({ teams, organizations }) => {
  const { accessToken, userRole, userId: userID, premiumUser } = useAuthorized();
  // Aggregated endpoint: try first, fall back to paginated if unavailable
  const [aggregatedData, setAggregatedData] = useState<{ results: DailyData[]; metadata: any } | null>(null);
  const [aggregatedFailed, setAggregatedFailed] = useState(false);
  const [aggregatedLoading, setAggregatedLoading] = useState(false);

  // Separate loading states for better UX
  const [isDateChanging, setIsDateChanging] = useState(false);

  // Create initial dates outside of state to prevent recreation
  const initialFromDate = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const initialToDate = useMemo(() => new Date(), []);

  // Single date state that directly triggers data fetching
  const [dateValue, setDateValue] = useState<DateRangePickerValue>({
    from: initialFromDate,
    to: initialToDate,
  });

  const [allTags, setAllTags] = useState<EntityList[]>([]);
  const { data: customers = [] } = useCustomers();
  const { data: agentsResponse } = useAgents();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = all_admin_roles.includes(userRole || "");
  const canViewTagUsage = isAdmin || internalUserRoles.includes(userRole || "");

  // Debounced search for user selector
  const [debouncedUserSearch, setDebouncedUserSearch] = useDebouncedState("", {
    wait: DEBOUNCE_WAIT_MS,
  });

  const {
    data: usersInfiniteData,
    fetchNextPage: fetchNextUsersPage,
    hasNextPage: hasNextUsersPage,
    isFetchingNextPage: isFetchingNextUsersPage,
    isLoading: isLoadingUsers,
  } = useInfiniteUsers(50, debouncedUserSearch || undefined);

  const userOptions = useMemo(() => {
    if (!usersInfiniteData?.pages) return [];
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    for (const page of usersInfiniteData.pages) {
      for (const user of page.users) {
        if (seen.has(user.user_id)) continue;
        seen.add(user.user_id);
        result.push({
          value: user.user_id,
          label: user.user_alias
            ? `${user.user_alias} (${user.user_id})`
            : user.user_email
              ? `${user.user_email} (${user.user_id})`
              : user.user_id,
        });
      }
    }
    return result;
  }, [usersInfiniteData]);

  // For admins: null means global view (all users), a string means filter by that user
  // For non-admins: always set to their own user ID
  const [selectedUserId, setSelectedUserId] = useState<string | null>(isAdmin ? null : userID || null);
  const [modelViewType, setModelViewType] = useState<"groups" | "individual">("groups");
  const [isCloudZeroModalOpen, setIsCloudZeroModalOpen] = useState(false);
  const [isGlobalExportModalOpen, setIsGlobalExportModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [usageView, setUsageView] = useState<UsageOption>("global");
  const [showCredentialBanner, setShowCredentialBanner] = useState(true);
  const [topKeysLimit, setTopKeysLimit] = useState<number>(5);
  const [topModelsLimit, setTopModelsLimit] = useState<number>(5);
  const [reloadToken, setReloadToken] = useState(0);
  // Sync selectedUserId when auth state settles (isAdmin/userID may be null on initial render)
  useEffect(() => {
    if (!isAdmin && userID) {
      setSelectedUserId(userID);
    }
  }, [isAdmin, userID]);

  // For non-admins or "my-usage" view, always pass their own user_id
  const effectiveUserId = usageView === "my-usage" || !isAdmin ? userID || null : selectedUserId;

  const startTime = useMemo(() => (dateValue.from ? new Date(dateValue.from) : null), [dateValue.from]);
  const endTime = useMemo(() => (dateValue.to ? new Date(dateValue.to) : null), [dateValue.to]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const tags = await tagListCall(accessToken, startTime, endTime);
        if (cancelled) return;
        setAllTags(
          Object.values(tags).map((tag: Tag) => ({
            label: tag.name,
            value: tag.name,
          })),
        );
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch tag list", e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, startTime, endTime]);

  // Try aggregated endpoint first, fall back to paginated on failure
  const aggregatedFetchIdRef = useRef(0);
  useEffect(() => {
    if (!accessToken || !startTime || !endTime) return;
    const fetchId = ++aggregatedFetchIdRef.current;
    setAggregatedLoading(true);
    setAggregatedFailed(false);
    setAggregatedData(null);

    userDailyActivityAggregatedCall(accessToken, startTime, endTime, effectiveUserId)
      .then((data) => {
        if (aggregatedFetchIdRef.current !== fetchId) return;
        setAggregatedData(data);
        setAggregatedLoading(false);
        setIsDateChanging(false);
      })
      .catch(() => {
        if (aggregatedFetchIdRef.current !== fetchId) return;
        setAggregatedFailed(true);
        setAggregatedLoading(false);
      });
  }, [accessToken, startTime, endTime, effectiveUserId, reloadToken]);

  // Paginated fallback — only enabled when aggregated endpoint fails
  const paginatedResult = usePaginatedDailyActivity({
    fetchFn: userDailyActivityCall,
    args: [accessToken, startTime, endTime, effectiveUserId],
    enabled: aggregatedFailed && !!accessToken && !!startTime && !!endTime,
  });

  // Derive userSpendData from whichever source is active
  const userSpendData = useMemo(() => {
    if (aggregatedData) return aggregatedData;
    if (aggregatedFailed) return paginatedResult.data;
    return { results: [] as DailyData[], metadata: {} as any };
  }, [aggregatedData, aggregatedFailed, paginatedResult.data]);

  const loading = aggregatedLoading || paginatedResult.loading;

  const statStripStatus = usageStatStripStatus(loading, aggregatedFailed ? paginatedResult.error : null);
  const usageTotals = useMemo(() => readUsageTotals(userSpendData.metadata ?? {}), [userSpendData.metadata]);

  // Clear isDateChanging when paginated data starts arriving
  useEffect(() => {
    if (aggregatedFailed && !paginatedResult.loading && paginatedResult.data.results.length > 0) {
      setIsDateChanging(false);
    }
  }, [aggregatedFailed, paginatedResult.loading, paginatedResult.data.results.length]);

  // Super responsive date change handler
  const handleDateChange = useCallback((newValue: DateRangePickerValue) => {
    // Instant visual feedback
    setIsDateChanging(true);

    // Update date immediately for UI responsiveness
    setDateValue(newValue);
  }, []);

  // Calculate top models from the breakdown data
  const topModels = useMemo(() => {
    const modelSpend: { [key: string]: MetricWithMetadata } = {};
    userSpendData.results.forEach((day) => {
      Object.entries(day.breakdown.models || {}).forEach(([model, metrics]) => {
        if (!modelSpend[model]) {
          modelSpend[model] = {
            metrics: {
              spend: 0,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              api_requests: 0,
              successful_requests: 0,
              failed_requests: 0,
              cache_read_input_tokens: 0,
              cache_creation_input_tokens: 0,
            },
            metadata: {},
            api_key_breakdown: {},
          };
        }
        modelSpend[model].metrics.spend += metrics.metrics.spend;
        modelSpend[model].metrics.prompt_tokens += metrics.metrics.prompt_tokens;
        modelSpend[model].metrics.completion_tokens += metrics.metrics.completion_tokens;
        modelSpend[model].metrics.total_tokens += metrics.metrics.total_tokens;
        modelSpend[model].metrics.api_requests += metrics.metrics.api_requests;
        modelSpend[model].metrics.successful_requests += metrics.metrics.successful_requests || 0;
        modelSpend[model].metrics.failed_requests += metrics.metrics.failed_requests || 0;
        modelSpend[model].metrics.cache_read_input_tokens += metrics.metrics.cache_read_input_tokens || 0;
        modelSpend[model].metrics.cache_creation_input_tokens += metrics.metrics.cache_creation_input_tokens || 0;
      });
    });

    return Object.entries(modelSpend)
      .map(([model, metrics]) => ({
        key: model,
        spend: metrics.metrics.spend,
        requests: metrics.metrics.api_requests,
        successful_requests: metrics.metrics.successful_requests,
        failed_requests: metrics.metrics.failed_requests,
        tokens: metrics.metrics.total_tokens,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, topModelsLimit);
  }, [userSpendData.results, topModelsLimit]);

  const topModelGroups = useMemo(() => {
    const modelGroupSpend: { [key: string]: MetricWithMetadata } = {};
    userSpendData.results.forEach((day) => {
      Object.entries(day.breakdown.model_groups || {}).forEach(([modelGroup, metrics]) => {
        if (!modelGroupSpend[modelGroup]) {
          modelGroupSpend[modelGroup] = {
            metrics: {
              spend: 0,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              api_requests: 0,
              successful_requests: 0,
              failed_requests: 0,
              cache_read_input_tokens: 0,
              cache_creation_input_tokens: 0,
            },
            metadata: {},
            api_key_breakdown: {},
          };
        }
        modelGroupSpend[modelGroup].metrics.spend += metrics.metrics.spend;
        modelGroupSpend[modelGroup].metrics.prompt_tokens += metrics.metrics.prompt_tokens;
        modelGroupSpend[modelGroup].metrics.completion_tokens += metrics.metrics.completion_tokens;
        modelGroupSpend[modelGroup].metrics.total_tokens += metrics.metrics.total_tokens;
        modelGroupSpend[modelGroup].metrics.api_requests += metrics.metrics.api_requests;
        modelGroupSpend[modelGroup].metrics.successful_requests += metrics.metrics.successful_requests || 0;
        modelGroupSpend[modelGroup].metrics.failed_requests += metrics.metrics.failed_requests || 0;
        modelGroupSpend[modelGroup].metrics.cache_read_input_tokens += metrics.metrics.cache_read_input_tokens || 0;
        modelGroupSpend[modelGroup].metrics.cache_creation_input_tokens +=
          metrics.metrics.cache_creation_input_tokens || 0;
      });
    });

    return Object.entries(modelGroupSpend)
      .map(([modelGroup, metrics]) => ({
        key: modelGroup,
        spend: metrics.metrics.spend,
        requests: metrics.metrics.api_requests,
        successful_requests: metrics.metrics.successful_requests,
        failed_requests: metrics.metrics.failed_requests,
        tokens: metrics.metrics.total_tokens,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, topModelsLimit);
  }, [userSpendData.results, topModelsLimit]);

  // Calculate provider spend from the breakdown data
  const providerSpend = useMemo(() => {
    const providerSpendMap: { [key: string]: MetricWithMetadata } = {};
    userSpendData.results.forEach((day) => {
      Object.entries(day.breakdown.providers || {}).forEach(([provider, metrics]) => {
        if (!providerSpendMap[provider]) {
          providerSpendMap[provider] = {
            metrics: {
              spend: 0,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              api_requests: 0,
              successful_requests: 0,
              failed_requests: 0,
              cache_read_input_tokens: 0,
              cache_creation_input_tokens: 0,
            },
            metadata: {},
            api_key_breakdown: {},
          };
        }
        providerSpendMap[provider].metrics.spend += metrics.metrics.spend;
        providerSpendMap[provider].metrics.prompt_tokens += metrics.metrics.prompt_tokens;
        providerSpendMap[provider].metrics.completion_tokens += metrics.metrics.completion_tokens;
        providerSpendMap[provider].metrics.total_tokens += metrics.metrics.total_tokens;
        providerSpendMap[provider].metrics.api_requests += metrics.metrics.api_requests;
        providerSpendMap[provider].metrics.successful_requests += metrics.metrics.successful_requests || 0;
        providerSpendMap[provider].metrics.failed_requests += metrics.metrics.failed_requests || 0;
        providerSpendMap[provider].metrics.cache_read_input_tokens += metrics.metrics.cache_read_input_tokens || 0;
        providerSpendMap[provider].metrics.cache_creation_input_tokens +=
          metrics.metrics.cache_creation_input_tokens || 0;
      });
    });

    return Object.entries(providerSpendMap).map(([provider, metrics]) => ({
      provider,
      spend: metrics.metrics.spend,
      requests: metrics.metrics.api_requests,
      successful_requests: metrics.metrics.successful_requests,
      failed_requests: metrics.metrics.failed_requests,
      tokens: metrics.metrics.total_tokens,
    }));
  }, [userSpendData.results]);

  // Calculate top API keys from the breakdown data
  const topKeys = useMemo(() => {
    const keySpend: { [key: string]: KeyMetricWithMetadata } = {};
    userSpendData.results.forEach((day) => {
      Object.entries(day.breakdown.api_keys || {}).forEach(([key, metrics]) => {
        if (!keySpend[key]) {
          keySpend[key] = {
            metrics: {
              spend: 0,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              api_requests: 0,
              successful_requests: 0,
              failed_requests: 0,
              cache_read_input_tokens: 0,
              cache_creation_input_tokens: 0,
            },
            metadata: {
              key_alias: metrics.metadata.key_alias,
              team_id: null,
              tags: metrics.metadata.tags || [],
            },
          };
        }
        keySpend[key].metrics.spend += metrics.metrics.spend;
        keySpend[key].metrics.prompt_tokens += metrics.metrics.prompt_tokens;
        keySpend[key].metrics.completion_tokens += metrics.metrics.completion_tokens;
        keySpend[key].metrics.total_tokens += metrics.metrics.total_tokens;
        keySpend[key].metrics.api_requests += metrics.metrics.api_requests;
        keySpend[key].metrics.successful_requests += metrics.metrics.successful_requests;
        keySpend[key].metrics.failed_requests += metrics.metrics.failed_requests;
        keySpend[key].metrics.cache_read_input_tokens += metrics.metrics.cache_read_input_tokens || 0;
        keySpend[key].metrics.cache_creation_input_tokens += metrics.metrics.cache_creation_input_tokens || 0;
      });
    });

    return Object.entries(keySpend)
      .map(([api_key, metrics]) => ({
        api_key,
        key_alias: metrics.metadata.key_alias || "-",
        tags: metrics.metadata.tags || [],
        spend: metrics.metrics.spend,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, topKeysLimit);
  }, [userSpendData.results, topKeysLimit]);

  const sortedDailyResults = useMemo(
    () => [...userSpendData.results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [userSpendData.results],
  );
  const modelMetrics = useMemo(() => processActivityData(userSpendData, "models", teams), [userSpendData, teams]);
  const keyMetrics = useMemo(() => processActivityData(userSpendData, "api_keys", teams), [userSpendData, teams]);
  const mcpServerMetrics = useMemo(
    () => processActivityData(userSpendData, "mcp_servers", teams),
    [userSpendData, teams],
  );

  return (
    <div style={{ width: "100%" }} className="p-8 relative">
      {/* Global Date Picker and Tabs - Single Row */}
      <div className="flex items-end justify-between gap-6 mb-6">
        <div className="flex-1">
          <UsageToolbar
            view={{
              value: usageView,
              onChange: (value) => setUsageView(value),
              isAdmin,
              canViewTagUsage,
            }}
            userFilter={
              isAdmin && usageView === "global"
                ? {
                    value: selectedUserId,
                    onChange: setSelectedUserId,
                    options: userOptions,
                    onSearchChange: setDebouncedUserSearch,
                    isLoading: isLoadingUsers,
                    hasNextPage: hasNextUsersPage,
                    isFetchingNextPage: isFetchingNextUsersPage,
                    onLoadMore: fetchNextUsersPage,
                  }
                : null
            }
            dateRange={dateValue}
            onDateRangeChange={handleDateChange}
          />
          {paginatedResult.isFetchingMore && (
            <Alert
              banner
              type="warning"
              className="mb-2"
              message={
                <div className="flex items-center justify-between">
                  <span>
                    <LoadingOutlined spin className="mr-2" />
                    Currently fetching spend data: fetched {paginatedResult.progress.currentPage} /{" "}
                    {paginatedResult.progress.totalPages} pages. Charts will update periodically as data loads. Moving
                    off of this page will stop and reset this. To continue using the UI in the meantime,{" "}
                    <a href={window.location.href} target="_blank" rel="noopener noreferrer">
                      open a new tab <ExportOutlined />
                    </a>
                    .
                  </span>
                  <Button type="primary" danger onClick={paginatedResult.cancel}>
                    Stop
                  </Button>
                </div>
              }
            />
          )}
          {paginatedResult.cancelled && (
            <Alert
              banner
              type="info"
              className="mb-2"
              message={
                <span>
                  Showing partial data ({paginatedResult.progress.currentPage}/{paginatedResult.progress.totalPages}{" "}
                  pages loaded)
                </span>
              }
            />
          )}
          {/* Your Usage / Global Usage Panel */}
          {(usageView === "global" || usageView === "my-usage") && (
            <>
              <Tabs defaultValue="cost" className="mt-4 gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="cost">Cost</TabsTrigger>
                    <TabsTrigger value="models">Model Activity</TabsTrigger>
                    <TabsTrigger value="keys">Key Activity</TabsTrigger>
                    <TabsTrigger value="mcp">MCP Server Activity</TabsTrigger>
                    <TabsTrigger value="endpoints">Endpoint Activity</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <UiButton variant="outline" size="sm" onClick={() => setIsAiChatOpen(true)}>
                      <Sparkles aria-hidden="true" />
                      Ask AI
                    </UiButton>
                    <UiButton variant="outline" size="sm" onClick={() => setIsGlobalExportModalOpen(true)}>
                      <Download aria-hidden="true" />
                      Export Data
                    </UiButton>
                  </div>
                </div>
                <UsageStatStrip
                  status={statStripStatus}
                  totals={usageTotals}
                  maxBudget={currentUser?.max_budget ?? null}
                  dateRange={dateValue}
                  onRetry={() => setReloadToken((token) => token + 1)}
                />
                <TabsContent value="cost">
                  <Grid numItems={2} className="gap-2 w-full">
                    {/* Daily Spend Chart */}
                    <Col numColSpan={2}>
                      <ShadcnCard>
                        <CardHeader>
                          <CardTitle className="text-base font-semibold">Daily Spend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loading ? (
                            <ChartLoader isDateChanging={isDateChanging} />
                          ) : (
                            <BarChart
                              data={sortedDailyResults}
                              index="date"
                              categories={["metrics.spend"]}
                              colors={["cyan"]}
                              valueFormatter={valueFormatterSpend}
                              yAxisWidth={100}
                              showLegend={false}
                              customTooltip={({ payload, active }) => {
                                if (!active || !payload?.[0]) return null;
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-4 shadow-lg rounded-lg border">
                                    <p className="font-bold">{data.date}</p>
                                    <p className="text-cyan-500">
                                      Spend: ${formatNumberWithCommas(data.metrics.spend, 2)}
                                    </p>
                                    <p className="text-gray-600">Requests: {data.metrics.api_requests}</p>
                                    <p className="text-gray-600">Successful: {data.metrics.successful_requests}</p>
                                    <p className="text-gray-600">Failed: {data.metrics.failed_requests}</p>
                                    <p className="text-gray-600">Tokens: {data.metrics.total_tokens}</p>
                                  </div>
                                );
                              }}
                            />
                          )}
                        </CardContent>
                      </ShadcnCard>
                    </Col>
                    {/* Top API Keys */}
                    <Col numColSpan={1}>
                      <Card className="h-full">
                        <Title>Top Virtual Keys</Title>
                        <TopKeyView
                          topKeys={topKeys}
                          teams={null}
                          topKeysLimit={topKeysLimit}
                          setTopKeysLimit={setTopKeysLimit}
                        />
                      </Card>
                    </Col>

                    {/* Top Models */}
                    <Col numColSpan={1}>
                      <Card className="h-full">
                        <Title>{modelViewType === "groups" ? "Top Public Model Names" : "Top Litellm Models"}</Title>
                        <div className="flex justify-between items-center mb-4">
                          <Segmented
                            options={[
                              { label: "5", value: 5 },
                              { label: "10", value: 10 },
                              { label: "25", value: 25 },
                              { label: "50", value: 50 },
                            ]}
                            value={topModelsLimit}
                            onChange={(value) => setTopModelsLimit(value as number)}
                          />
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                modelViewType === "groups"
                                  ? "bg-white shadow-xs text-gray-900"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                              onClick={() => setModelViewType("groups")}
                            >
                              Public Model Name
                            </button>
                            <button
                              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                modelViewType === "individual"
                                  ? "bg-white shadow-xs text-gray-900"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                              onClick={() => setModelViewType("individual")}
                            >
                              Litellm Model Name
                            </button>
                          </div>
                        </div>
                        {loading ? (
                          <ChartLoader isDateChanging={isDateChanging} />
                        ) : (
                          <div className="relative max-h-[600px] overflow-y-auto">
                            {(() => {
                              const modelData = modelViewType === "groups" ? topModelGroups : topModels;
                              return (
                                <BarChart
                                  className="mt-4"
                                  style={{ height: Math.min(modelData.length, topModelsLimit) * 52 }}
                                  data={modelData}
                                  index="key"
                                  categories={["spend"]}
                                  colors={["cyan"]}
                                  valueFormatter={valueFormatterSpend}
                                  layout="vertical"
                                  yAxisWidth={200}
                                  showLegend={false}
                                  customTooltip={({ payload, active }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-4 shadow-lg rounded-lg border">
                                        <p className="font-bold">{data.key}</p>
                                        <p className="text-cyan-500">Spend: ${formatNumberWithCommas(data.spend, 2)}</p>
                                        <p className="text-gray-600">
                                          Total Requests: {data.requests.toLocaleString()}
                                        </p>
                                        <p className="text-green-600">
                                          Successful: {data.successful_requests.toLocaleString()}
                                        </p>
                                        <p className="text-red-600">Failed: {data.failed_requests.toLocaleString()}</p>
                                        <p className="text-gray-600">Tokens: {data.tokens.toLocaleString()}</p>
                                      </div>
                                    );
                                  }}
                                />
                              );
                            })()}
                          </div>
                        )}
                      </Card>
                    </Col>

                    {/* Spend by Provider */}
                    <Col numColSpan={2}>
                      <SpendByProvider
                        loading={loading}
                        isDateChanging={isDateChanging}
                        providerSpend={providerSpend}
                      />
                    </Col>
                  </Grid>
                </TabsContent>
                <TabsContent value="models">
                  <ActivityMetrics modelMetrics={modelMetrics} />
                </TabsContent>
                <TabsContent value="keys">
                  <ActivityMetrics modelMetrics={keyMetrics} />
                </TabsContent>
                <TabsContent value="mcp">
                  <ActivityMetrics modelMetrics={mcpServerMetrics} />
                </TabsContent>
                <TabsContent value="endpoints">
                  <EndpointUsage userSpendData={userSpendData} />
                </TabsContent>
              </Tabs>
            </>
          )}
          {/* Organization Usage Panel */}

          {usageView === "organization" && (
            <EntityUsage
              accessToken={accessToken}
              entityType="organization"
              userID={userID}
              userRole={userRole}
              dateValue={dateValue}
              entityList={
                organizations?.map((organization) => ({
                  label: organization.organization_alias,
                  value: organization.organization_id,
                })) || null
              }
              premiumUser={premiumUser}
            />
          )}

          {/* Team Usage Panel */}
          {usageView === "team" && (
            <EntityUsage
              accessToken={accessToken}
              entityType="team"
              userID={userID}
              userRole={userRole}
              entityList={
                teams?.map((team) => ({
                  label: team.team_alias,
                  value: team.team_id,
                })) || null
              }
              premiumUser={premiumUser}
              dateValue={dateValue}
            />
          )}

          {/* Customer Usage Panel */}
          {usageView === "customer" && (
            <EntityUsage
              accessToken={accessToken}
              entityType="customer"
              userID={userID}
              userRole={userRole}
              entityList={
                customers?.map((customer) => ({
                  label: customer.alias || customer.user_id,
                  value: customer.user_id,
                })) || null
              }
              premiumUser={premiumUser}
              dateValue={dateValue}
            />
          )}
          {/* Tag Usage Panel */}
          {usageView === "tag" && (
            <>
              {showCredentialBanner && (
                <Alert
                  banner
                  type="info"
                  message="Reusable credentials are automatically tracked as tags"
                  description={
                    <Typography.Text>
                      When a reusable credential is used, it will appear as a tag prefixed with{" "}
                      <Typography.Text code>Credential: </Typography.Text>
                      in this view.
                    </Typography.Text>
                  }
                  closable
                  onClose={() => setShowCredentialBanner(false)}
                  className="mb-5"
                />
              )}
              <EntityUsage
                accessToken={accessToken}
                entityType="tag"
                userID={userID}
                userRole={userRole}
                entityList={allTags}
                premiumUser={premiumUser}
                dateValue={dateValue}
              />
            </>
          )}
          {usageView === "agent" && (
            <EntityUsage
              accessToken={accessToken}
              entityType="agent"
              userID={userID}
              userRole={userRole}
              entityList={
                agentsResponse?.agents?.map((agent) => ({ label: agent.agent_name, value: agent.agent_id })) || null
              }
              premiumUser={premiumUser}
              dateValue={dateValue}
            />
          )}
          {/* User Usage Panel */}
          {usageView === "user" && (
            <EntityUsage
              accessToken={accessToken}
              entityType="user"
              userID={userID}
              userRole={userRole}
              entityList={userOptions.length > 0 ? userOptions : null}
              premiumUser={premiumUser}
              dateValue={dateValue}
            />
          )}
          {/* User Agent Activity Panel */}
          {usageView === "user-agent-activity" && (
            <UserAgentActivity accessToken={accessToken} userRole={userRole} dateValue={dateValue} />
          )}
        </div>
      </div>

      {/* CloudZero Export Modal */}
      <CloudZeroExportModal
        isOpen={isCloudZeroModalOpen}
        onClose={() => setIsCloudZeroModalOpen(false)}
        accessToken={accessToken}
      />

      {/* Global Usage Export Modal */}
      <EntityUsageExportModal
        isOpen={isGlobalExportModalOpen}
        onClose={() => setIsGlobalExportModalOpen(false)}
        entityType="team"
        spendData={{
          results: userSpendData.results,
          metadata: userSpendData.metadata,
        }}
        dateRange={dateValue}
        selectedFilters={[]}
        customTitle="Export Usage Data"
      />

      {/* AI Chat Panel */}
      <UsageAIChatPanel open={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} accessToken={accessToken} />
    </div>
  );
};

// Add this helper function to process model-specific activity data
const getModelActivityData = (userSpendData: { results: DailyData[]; metadata: any }) => {
  const modelData: {
    [key: string]: {
      total_requests: number;
      total_tokens: number;
      daily_data: Array<{
        date: string;
        api_requests: number;
        total_tokens: number;
      }>;
    };
  } = {};

  userSpendData.results.forEach((day: DailyData) => {
    Object.entries(day.breakdown.models || {}).forEach(([model, metrics]) => {
      if (!modelData[model]) {
        modelData[model] = {
          total_requests: 0,
          total_tokens: 0,
          daily_data: [],
        };
      }

      modelData[model].total_requests += metrics.metrics.api_requests;
      modelData[model].total_tokens += metrics.metrics.total_tokens;
      modelData[model].daily_data.push({
        date: day.date,
        api_requests: metrics.metrics.api_requests,
        total_tokens: metrics.metrics.total_tokens,
      });
    });
  });

  return modelData;
};

export default UsagePage;
