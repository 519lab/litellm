import React from "react";
import { cn } from "@/lib/cva.config";
import { timeAgo } from "./format";
import type { WorkflowRunMessage } from "./types";

const ROLE_TONE: Record<string, string> = {
  user: "text-primary",
  assistant: "text-foreground",
  system: "text-muted-foreground",
  tool_result: "text-secondary-foreground",
};

function MessageRow({ message }: { message: WorkflowRunMessage }) {
  return (
    <li className="grid grid-cols-[80px_1fr] items-start gap-x-4 border-b border-border py-2.5 font-mono text-xs">
      <span className={cn("pt-px", ROLE_TONE[message.role] ?? "text-muted-foreground")}>[{message.role}]</span>
      <div>
        <span className="block leading-relaxed whitespace-pre-wrap break-words text-foreground">{message.content}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{timeAgo(message.created_at)}</span>
      </div>
    </li>
  );
}

export function MessageList({ messages }: { messages: WorkflowRunMessage[] }) {
  if (messages.length === 0) {
    return <p className="py-3 font-mono text-xs text-muted-foreground">No messages</p>;
  }
  return (
    <ul className="pb-1">
      {messages.map((message) => (
        <MessageRow key={message.message_id} message={message} />
      ))}
    </ul>
  );
}
