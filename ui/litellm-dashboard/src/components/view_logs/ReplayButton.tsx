"use client";

import React from "react";
import { Button, Tooltip } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import type { MessageType } from "@/components/chat_ui/types";
import { migratedHref } from "@/utils/migratedPages";
import type { LogEntry } from "./columns";

const CHAT_COMPLETION_TYPES = new Set(["completion", "acompletion"]);

function normalizeMessages(raw: string | any[] | Record<string, any>): MessageType[] {
  let arr: any[];
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    return [];
  }
  return arr
    .filter((m) => m && typeof m === "object" && typeof m.role === "string" && m.content !== undefined)
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
