"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlaygroundRun } from "../hooks/usePlaygroundHistory";

interface SaveRunDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (run: Omit<PlaygroundRun, "id" | "timestamp">) => void;
}

export function SaveRunDialog({ open, onClose, onSave }: SaveRunDialogProps) {
  const [model, setModel] = useState("");
  const [response, setResponse] = useState("");
  const [label, setLabel] = useState("");
  const [promptTokens, setPromptTokens] = useState("");
  const [completionTokens, setCompletionTokens] = useState("");

  function handleSave() {
    if (!model.trim() && !response.trim()) return;
    onSave({
      model: model.trim() || "unknown",
      messages: [],
      response: response.trim(),
      promptTokens: parseInt(promptTokens) || 0,
      completionTokens: parseInt(completionTokens) || 0,
      durationMs: 0,
      label: label.trim() || undefined,
    });
    setModel("");
    setResponse("");
    setLabel("");
    setPromptTokens("");
    setCompletionTokens("");
    onClose();
  }

  function handleClose() {
    setModel("");
    setResponse("");
    setLabel("");
    setPromptTokens("");
    setCompletionTokens("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save run to history</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="run-model">Model</Label>
            <Input
              id="run-model"
              placeholder="e.g. Qwen3.6-35B-A3B"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="run-label">Label (optional)</Label>
            <Input
              id="run-label"
              placeholder="e.g. summarization test"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="run-response">Response snippet</Label>
            <Textarea
              id="run-response"
              className="resize-none min-h-[80px]"
              placeholder="Paste the model response here…"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="run-prompt-tokens">Prompt tokens</Label>
              <Input
                id="run-prompt-tokens"
                type="number"
                placeholder="0"
                value={promptTokens}
                onChange={(e) => setPromptTokens(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="run-completion-tokens">Completion tokens</Label>
              <Input
                id="run-completion-tokens"
                type="number"
                placeholder="0"
                value={completionTokens}
                onChange={(e) => setCompletionTokens(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!model.trim() && !response.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
