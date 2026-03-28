"use client";

import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataTablePagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  selectedCount = 0,
  className,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  selectedCount?: number;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageSizeOptions = [10, 20, 50, 100];
  const rowsPerPageOptions = pageSizeOptions.includes(limit)
    ? pageSizeOptions
    : [...pageSizeOptions, limit].sort((a, b) => a - b);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-3 px-1 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-700">{selectedCount}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span> row(s)
        selected.
      </p>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {onLimitChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Rows per page</span>
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800"
            >
              {rowsPerPageOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <p className="min-w-24 text-center text-sm font-semibold text-slate-700">
          Page {page} of {totalPages}
        </p>

        <Button
          type="button"
          disabled={!canPrev}
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          className="h-9 w-9"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          disabled={!canPrev}
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          disabled={!canNext}
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          disabled={!canNext}
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          className="h-9 w-9"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
