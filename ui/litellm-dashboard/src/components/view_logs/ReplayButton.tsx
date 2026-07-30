"use client";

import React from "react";
import { Button, Tooltip } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import type { MessageType } from "@/components/chat_ui/types";
import { migratedHref } from "@/utils/migratedPages";
import type { LogEntry } from "./columns";

const CHAT_COMPLETION_TYPES = new Set(["completion", "acompletion"]);

export function normalizeMessages(raw: LogEntry["messages"]): MessageType[] {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } })()
      : [];
  return arr
    .filter((m): m is Record<string, unknown> =>
      m !== null && typeof m === "object" && !Array.isArray(m) &&
      typeof (m as Record<string, unknown>).role === "string" &&
      (m as Record<string, unknown>).content != null
    )
    .map((m): MessageType => ({
      role: m.role as string,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));
}

export function ReplayButton({ row }: { row: LogEntry }) {
  if (!CHAT_COMPLETION_TYPES.has(row.call_type)) return null;

  const handleReplay = () => {
    const messages = normalizeMessages(row.messages);
    if (messages.length === 0) return;

    sessionStorage.setItem(
      "playground_replay",
      JSON.stringify({ model: row.model, messages, request_id: row.request_id }),
    );
    window.location.href = migratedHref("playground");
  };

  return (
    <Tooltip title="Replay in Playground">
      <Button
        icon={<PlayCircleOutlined />}
        size="small"
        type="text"
        onClick={handleReplay}
        aria-label="Replay in Playground"
      />
    </Tooltip>
  );
}
