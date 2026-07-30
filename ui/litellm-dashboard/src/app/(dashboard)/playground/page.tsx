"use client";

import { useState, useEffect } from "react";
import { History, Save } from "lucide-react";
import AgentBuilderView from "@/app/(dashboard)/playground/components/chat_ui/AgentBuilderView";
import ChatUI from "@/app/(dashboard)/playground/components/chat_ui/ChatUI";
import CompareUI from "@/app/(dashboard)/playground/components/compareUI/CompareUI";
import ComplianceUI from "@/app/(dashboard)/playground/components/complianceUI/ComplianceUI";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { DeprecationBanner } from "@/components/DeprecationBanner";
import { ReplayBanner } from "@/components/view_logs/ReplayBanner";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { fetchProxySettings } from "@/utils/proxyUtils";
import { Button } from "@/components/ui/button";
import { usePlaygroundHistory } from "./hooks/usePlaygroundHistory";
import { PlaygroundHistoryPanel } from "./components/PlaygroundHistoryPanel";
import { SaveRunDialog } from "./components/SaveRunDialog";
import { RunDetailDialog } from "./components/RunDetailDialog";
import type { PlaygroundRun } from "./hooks/usePlaygroundHistory";
import type { MessageType } from "@/components/chat_ui/types";

interface ProxySettings {
  PROXY_BASE_URL?: string;
  LITELLM_UI_API_DOC_BASE_URL?: string | null;
}

interface ReplayPayload {
  model: string;
  messages: MessageType[];
  request_id: string;
}

export function readAndClearReplay(): ReplayPayload | null {
  const raw = sessionStorage.getItem("playground_replay");
  if (!raw) return null;
  sessionStorage.removeItem("playground_replay");
  try {
    const data = JSON.parse(raw);
    if (typeof data.model !== "string" || !Array.isArray(data.messages)) return null;
    return data as ReplayPayload;
  } catch {
    return null;
  }
}

export default function PlaygroundPage() {
  const { accessToken, userRole, userId, disabledPersonalKeyCreation, token } = useAuthorized();
  const [proxySettings, setProxySettings] = useState<ProxySettings | undefined>(undefined);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [detailRun, setDetailRun] = useState<PlaygroundRun | undefined>(undefined);
  const [replay, setReplay] = useState<ReplayPayload | null>(null);

  const { runs, addRun, deleteRun, clearHistory } = usePlaygroundHistory();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReplay(readAndClearReplay());
    }
  }, []);

  useEffect(() => {
    const initializeProxySettings = async () => {
      if (accessToken) {
        const settings = await fetchProxySettings(accessToken);
        if (settings) {
          setProxySettings({
            PROXY_BASE_URL: settings.PROXY_BASE_URL,
            LITELLM_UI_API_DOC_BASE_URL: settings.LITELLM_UI_API_DOC_BASE_URL,
          });
        }
      }
    };

    initializeProxySettings();
  }, [accessToken]);

  function handleViewRun(run: PlaygroundRun) {
    setDetailRun(run);
    setHistoryOpen(false);
  }

  return (
    <div className="h-full w-full flex flex-col">
      {replay && (
        <ReplayBanner
          model={replay.model}
          requestId={replay.request_id}
          onDismiss={() => setReplay(null)}
        />
      )}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSaveOpen(true)}
          className="gap-1.5"
        >
          <Save className="size-3.5" />
          Save run
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          className="gap-1.5"
        >
          <History className="size-3.5" />
          History
          {runs.length > 0 && (
            <span className="ml-0.5 text-[10px] font-mono text-muted-foreground">
              ({runs.length})
            </span>
          )}
        </Button>
      </div>

      <TabGroup className="w-full" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <TabList className="mb-0">
          <Tab>Chat</Tab>
          <Tab>Compare</Tab>
          <Tab>Compliance</Tab>
          <Tab>Agent Builder (Experimental)</Tab>
        </TabList>
        <TabPanels className="h-full">
          <TabPanel className="h-full">
            <ChatUI
              accessToken={accessToken}
              token={token}
              userRole={userRole}
              userID={userId}
              disabledPersonalKeyCreation={disabledPersonalKeyCreation}
              proxySettings={proxySettings}
              initialModel={replay?.model}
              initialMessages={replay?.messages}
            />
          </TabPanel>
          <TabPanel className="h-full">
            <CompareUI accessToken={accessToken} disabledPersonalKeyCreation={disabledPersonalKeyCreation} />
          </TabPanel>
          <TabPanel className="h-full">
            <ComplianceUI accessToken={accessToken} disabledPersonalKeyCreation={disabledPersonalKeyCreation} />
          </TabPanel>
          <TabPanel className="h-full">
            <DeprecationBanner featureName="The Playground's Agent Builder" />
            <AgentBuilderView
              accessToken={accessToken}
              token={token}
              userID={userId}
              userRole={userRole}
              disabledPersonalKeyCreation={disabledPersonalKeyCreation}
              proxySettings={proxySettings}
              customProxyBaseUrl={proxySettings?.LITELLM_UI_API_DOC_BASE_URL ?? proxySettings?.PROXY_BASE_URL}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <PlaygroundHistoryPanel
        runs={runs}
        onView={handleViewRun}
        onDelete={deleteRun}
        onClear={clearHistory}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <SaveRunDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={addRun}
      />

      <RunDetailDialog
        run={detailRun}
        onClose={() => setDetailRun(undefined)}
      />
    </div>
  );
}
