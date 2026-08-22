"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cva.config";
import { migratedHref } from "@/utils/migratedPages";
import { ArrowRight, ExternalLink, FileSearch, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { ReactNode } from "react";

export interface PaletteEntry {
  readonly key: string;
  readonly label: string;
  readonly section: string;
  readonly href: string;
  readonly icon?: ReactNode;
  readonly external?: boolean;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: readonly PaletteEntry[];
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{11,}$/;
const MAX_RESULTS = 12;

export const isRequestIdQuery = (query: string): boolean => REQUEST_ID_PATTERN.test(query) && query.includes("-");

export const requestLookupEntry = (requestId: string): PaletteEntry => ({
  key: `request:${requestId}`,
  label: `Open request ${requestId}`,
  section: "Logs",
  href: `${migratedHref("logs")}?request_id=${encodeURIComponent(requestId)}`,
  icon: <FileSearch className="size-4" />,
});

export const paletteResults = (entries: readonly PaletteEntry[], query: string): readonly PaletteEntry[] => {
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? entries.filter((e) => e.label.toLowerCase().includes(needle) || e.section.toLowerCase().includes(needle))
    : entries;
  const lookup = isRequestIdQuery(query.trim()) ? [requestLookupEntry(query.trim())] : [];
  return [...lookup, ...matches].slice(0, MAX_RESULTS);
};

export function CommandPalette({ open, onOpenChange, entries }: CommandPaletteProps) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const results = paletteResults(entries, query);
  const active = results[Math.min(activeIndex, Math.max(results.length - 1, 0))];

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery("");
      setActiveIndex(0);
    }
    onOpenChange(next);
  };

  const choose = (entry: PaletteEntry | undefined) => {
    if (!entry) return;
    handleOpenChange(false);
    if (entry.external) {
      window.open(entry.href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(entry.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="top-[18%] -translate-y-0 gap-0 p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={active ? `${listId}-${active.key}` : undefined}
            aria-label="Search pages or paste a request id"
            placeholder="Go to a page or paste a request id"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matching pages</li>
          )}
          {results.map((entry, index) => {
            const selected = entry.key === active?.key;
            return (
              <li
                key={entry.key}
                id={`${listId}-${entry.key}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(entry)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                  selected ? "bg-accent text-accent-foreground" : "text-foreground",
                )}
              >
                <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                  {entry.icon}
                </span>
                <span className="flex-1 truncate">{entry.label}</span>
                <span className="text-[11px] text-muted-foreground">{entry.section}</span>
                {entry.external ? (
                  <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
                ) : (
                  <ArrowRight className={cn("size-3.5", selected ? "opacity-100" : "opacity-0")} aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
