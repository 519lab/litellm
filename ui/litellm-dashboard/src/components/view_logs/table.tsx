import { Fragment, useState } from "react";
import {
  ColumnDef,
  RowData,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Row,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { AlertCircle, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    numeric?: boolean;
    label?: string;
  }
}

const SKELETON_ROW_COUNT = 6;

interface DataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  getRowId?: (row: TData, index: number) => string;
  onRowClick?: (row: TData) => void;
  /** Renders inside a single colspan cell */
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  noDataMessage?: string;
  noDataHint?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  columnVisibility?: VisibilityState;
  /** Enable client-side column sorting (defaults to false to avoid conflicts with server-side sorting) */
  enableSorting?: boolean;
}

export function DataTable<TData, TValue>({
  data = [],
  columns,
  getRowId,
  onRowClick,
  renderSubComponent,
  getRowCanExpand,
  isLoading = false,
  loadingMessage = "Loading...",
  noDataMessage = "No results",
  noDataHint,
  errorMessage = null,
  onRetry,
  columnVisibility,
  enableSorting = false,
}: DataTableProps<TData, TValue>) {
  const supportsExpansion = !!renderSubComponent && !!getRowCanExpand;
  const hasExplicitColumnSizes = columns.some((column) => column.size !== undefined);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      ...(enableSorting && { sorting }),
      ...(columnVisibility && { columnVisibility }),
    },
    ...(enableSorting && {
      onSortingChange: setSorting,
      enableSortingRemoval: false,
    }),
    ...(supportsExpansion && { getRowCanExpand }),
    ...(getRowId && { getRowId }),
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(supportsExpansion && { getExpandedRowModel: getExpandedRowModel() }),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const tableClassName = hasExplicitColumnSizes ? "table-fixed" : "table-fixed w-full box-border";
  const tableStyle = hasExplicitColumnSizes ? { minWidth: table.getCenterTotalSize() } : { minWidth: "400px" };

  const renderBody = () => {
    if (errorMessage) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={visibleColumnCount} className="h-24 text-center align-middle">
            <div role="alert" className="flex flex-col items-center gap-2 text-sm text-destructive">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-4" aria-hidden="true" />
                {errorMessage}
              </span>
              {onRetry && (
                <Button variant="outline" size="xs" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    }
    if (isLoading) {
      return Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) => (
        <TableRow key={rowIndex} className="hover:bg-transparent" aria-busy="true">
          {table.getVisibleLeafColumns().map((column, cellIndex) => (
            <TableCell key={column.id} className="py-1.5 first:pl-4 last:pr-4">
              {rowIndex === 0 && cellIndex === 0 && <span className="sr-only">{loadingMessage}</span>}
              <Skeleton className="h-3.5 w-3/4" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }
    if (table.getRowModel().rows.length === 0) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={visibleColumnCount} className="h-32 text-center align-middle">
            <div className="flex flex-col items-center gap-1">
              <Inbox className="size-5 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">{noDataMessage}</p>
              {noDataHint && <p className="text-xs text-muted-foreground">{noDataHint}</p>}
            </div>
          </TableCell>
        </TableRow>
      );
    }
    return table.getRowModel().rows.map((row) => (
      <Fragment key={row.id}>
        <TableRow className={`h-8 ${onRowClick ? "cursor-pointer" : ""}`} onClick={() => onRowClick?.(row.original)}>
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={cell.id}
              className={`py-0.5 max-h-8 overflow-hidden text-ellipsis whitespace-nowrap first:pl-4 last:pr-4 ${
                cell.column.columnDef.meta?.numeric ? "text-right tabular-nums" : ""
              }`}
              style={hasExplicitColumnSizes ? { width: cell.column.getSize() } : undefined}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>

        {supportsExpansion && row.getIsExpanded() && renderSubComponent && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={row.getVisibleCells().length} className="p-0">
              <div className="w-full max-w-full overflow-hidden box-border">{renderSubComponent({ row })}</div>
            </TableCell>
          </TableRow>
        )}
      </Fragment>
    ));
  };

  return (
    <div className="rounded-lg custom-border overflow-hidden w-full max-w-full box-border">
      <Table className={tableClassName} style={tableStyle}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
              {headerGroup.headers.map((header) => {
                const canSort = enableSorting && header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                const numeric = header.column.columnDef.meta?.numeric;

                return (
                  <TableHead
                    key={header.id}
                    className={`py-1 h-8 text-xs font-medium text-muted-foreground first:pl-4 last:pr-4 ${
                      canSort ? "cursor-pointer select-none hover:bg-muted" : ""
                    }`}
                    style={hasExplicitColumnSizes ? { width: header.getSize() } : undefined}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <div className={`flex items-center gap-1 ${numeric ? "justify-end" : ""}`}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-muted-foreground">
                            {isSorted === "asc" ? "↑" : isSorted === "desc" ? "↓" : "⇅"}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>{renderBody()}</TableBody>
      </Table>
    </div>
  );
}
