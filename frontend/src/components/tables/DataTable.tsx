"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function DataTable<TData>({
  columns,
  data,
  className,
  onRowClick,
  enableRowSelection = true,
  onRowSelectionChange,
  emptyMessage = "No results found.",
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  className?: string;
  onRowClick?: (row: TData) => void;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedCount: number, totalRows: number) => void;
  emptyMessage?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const resolvedColumns = useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectionColumn: ColumnDef<TData, unknown> = {
      id: "__select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected();
        const isSomeSelected = table.getIsSomePageRowsSelected();
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              aria-label="Select all rows"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = !isAllSelected && isSomeSelected;
              }}
              onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500"
            />
          </div>
        );
      },
      cell: ({ row }) => {
        const isSelected = row.getIsSelected();
        const isSomeSelected = row.getIsSomeSelected();
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              aria-label="Select row"
              checked={isSelected}
              ref={(el) => {
                if (el) el.indeterminate = !isSelected && isSomeSelected;
              }}
              onClick={(event) => event.stopPropagation()}
              onChange={(e) => row.toggleSelected(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-500"
            />
          </div>
        );
      },
      meta: { align: "center" },
    };

    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  useEffect(() => {
    onRowSelectionChange?.(selectedCount, data.length);
  }, [selectedCount, data.length, onRowSelectionChange]);

  function alignClass(columnId: string, meta?: unknown) {
    const resolvedMeta = (meta ?? {}) as {
      align?: "left" | "center" | "right";
    };
    if (resolvedMeta.align === "center") return "text-center";
    if (resolvedMeta.align === "right") return "text-right";
    if (resolvedMeta.align === "left") return "text-left";
    if (columnId === "actions") return "text-center";
    return "text-left";
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <Table className="min-w-full text-sm">
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-12 whitespace-nowrap px-4 text-sm font-semibold text-slate-900",
                      alignClass(
                        header.column.id,
                        header.column.columnDef.meta,
                      ),
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 text-left hover:text-slate-950"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "border-slate-200 transition-colors hover:bg-slate-50",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-4 py-3 align-middle text-slate-700",
                        alignClass(cell.column.id, cell.column.columnDef.meta),
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
