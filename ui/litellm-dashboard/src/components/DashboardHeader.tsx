"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { getBreadcrumb, navEntriesForRole } from "@/components/leftnav";
import { CommandPalette } from "@/components/CommandPalette/CommandPalette";
import { Button } from "@/components/ui/button";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NotificationsBell } from "@/components/Navbar/NotificationsBell/NotificationsBell";
import ViewSwitcher from "@/components/Navbar/ViewSwitcher";
import WorkerDropdown from "@/components/Navbar/WorkerDropdown/WorkerDropdown";
import { useWorker } from "@/hooks/useWorker";
import { clearTokenCookies } from "@/utils/cookieUtils";
import { clearStoredReturnUrl, getLoginUrl } from "@/utils/returnUrlUtils";

interface DashboardHeaderProps {
  page: string;
}

// Top bar for the dashboard shell. Sits only over the content column (the brand
// lives in the sidebar header); mirrors the design's breadcrumb-left / tools-right layout.
export function DashboardHeader({ page }: DashboardHeaderProps) {
  const { title } = getBreadcrumb(page);
  const { isControlPlane, selectedWorker } = useWorker();
  const showWorkerSwitch = isControlPlane && selectedWorker !== null;
  const { userRole } = useAuthorized();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const entries = useMemo(() => navEntriesForRole(userRole), [userRole]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      setPaletteOpen((open) => !open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleWorkerSwitch = (workerId: string) => {
    clearTokenCookies();
    clearStoredReturnUrl();
    localStorage.removeItem("litellm_selected_worker_id");
    localStorage.removeItem("litellm_worker_url");
    window.location.href = `${getLoginUrl()}?worker=${encodeURIComponent(workerId)}`;
  };

  return (
    <header className="flex h-14 flex-none items-center justify-between gap-4 border-b border-border bg-background px-4">
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="flex-none">
            <ViewSwitcher />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-none items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaletteOpen(true)}
          aria-label="Search pages or open a request (Ctrl+K)"
          className="h-8 gap-2 pr-1.5 pl-2.5 text-muted-foreground"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-px font-mono text-[10px]">⌘K</kbd>
        </Button>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} entries={entries} />
        <Separator orientation="vertical" className="mx-1.5 h-5" />
        {showWorkerSwitch && (
          <>
            <WorkerDropdown onWorkerSwitch={handleWorkerSwitch} />
            <Separator orientation="vertical" className="mx-1.5 h-5" />
          </>
        )}
        <NotificationsBell />
      </div>
    </header>
  );
}

export default DashboardHeader;
