"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useAdminAddons } from "@/features/admin/hooks/useAdminAddons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTable } from "@/components/tables/DataTable";
import { DataTablePagination } from "@/components/tables/DataTablePagination";
import { usePagination } from "@/hooks/usePagination";
import { AddonFormSheet } from "./AddonFormSheet";
import { DeleteAddonDialog } from "./DeleteAddonDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, Search, RefreshCw } from "lucide-react";
import type { AddonCatalog } from "@/types/domain.types";
import { Input } from "@/components/ui/input";

const BILLING_OPTIONS = [
  "ALL",
  "FLAT_FEE",
  "METERED",
  "FIXED_AMENITY",
] as const;
type AddonSortColumn =
  | "name"
  | "category"
  | "billingType"
  | "defaultRate"
  | "unitOfMeasure";
type AddonSortDirection = "asc" | "desc";

export function AddonCatalogTable() {
  const { data: addons, isLoading, isFetching, refetch } = useAdminAddons();
  const pagination = usePagination({ page: 1, limit: 10 });
  const { page, limit, setPage, setLimit, reset } = pagination;

  const [editTarget, setEditTarget] = useState<AddonCatalog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddonCatalog | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [billingFilter, setBillingFilter] =
    useState<(typeof BILLING_OPTIONS)[number]>("ALL");
  const [sortColumn, setSortColumn] = useState<AddonSortColumn>("name");
  const [sortDirection, setSortDirection] = useState<AddonSortDirection>("asc");

  const filteredAddons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (addons ?? []).filter((addon) => {
      const matchesBilling =
        billingFilter === "ALL" || addon.billingType === billingFilter;
      const searchable =
        `${addon.name} ${addon.category} ${addon.billingType} ${addon.unitOfMeasure ?? ""} ${addon.defaultRate ?? ""}`.toLowerCase();
      const matchesSearch = q.length === 0 || searchable.includes(q);
      return matchesBilling && matchesSearch;
    });
  }, [addons, searchQuery, billingFilter]);

  const sortedAddons = useMemo(() => {
    const rows = [...filteredAddons];
    const dir = sortDirection === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const getVal = (addon: AddonCatalog): string | number => {
        if (sortColumn === "defaultRate") return Number(addon.defaultRate ?? 0);
        return String(addon[sortColumn] ?? "").toLowerCase();
      };
      const aVal = getVal(a);
      const bVal = getVal(b);
      if (typeof aVal === "number" && typeof bVal === "number")
        return (aVal - bVal) * dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
    return rows;
  }, [filteredAddons, sortColumn, sortDirection]);

  const pagedAddons = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedAddons.slice(start, end);
  }, [sortedAddons, page, limit]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(sortedAddons.length / Math.max(1, limit)),
    );
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [sortedAddons.length, limit, page, setPage]);

  const columns = useMemo<ColumnDef<AddonCatalog, unknown>[]>(
    () => [
      {
        header: "Add-on Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">{row.original.name}</span>
        ),
      },
      {
        header: "Category",
        accessorKey: "category",
        cell: ({ row }) => (
          <span className="capitalize text-slate-700">{row.original.category}</span>
        ),
      },
      {
        header: "Billing Type",
        accessorKey: "billingType",
        cell: ({ row }) => <StatusBadge status={row.original.billingType} />,
      },
      {
        header: "Default Rate",
        id: "defaultRate",
        accessorFn: (addon) => addon.defaultRate ?? 0,
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.defaultRate ? `₱${row.original.defaultRate}` : "—"}
          </span>
        ),
      },
      {
        header: "Unit",
        accessorKey: "unitOfMeasure",
        cell: ({ row }) => (
          <span className="text-slate-700">{row.original.unitOfMeasure ?? "—"}</span>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => {
          const addon = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditTarget(addon)}>
                    Edit Add-on
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(addon)}
                  >
                    Delete Add-on
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  if (isLoading) return <TableSkeleton />;
  if (!addons?.length)
    return (
      <EmptyState
        title="No add-ons found"
        description="Create your first platform-wide add-on to get started."
      />
    );

  if (sortedAddons.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                reset();
              }}
              placeholder="Search add-on name, category, billing type"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <select
              id="addon-billing-filter"
              value={billingFilter}
              onChange={(event) => {
                setBillingFilter(
                  event.target.value as (typeof BILLING_OPTIONS)[number],
                );
                reset();
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {BILLING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL"
                    ? "All billing types"
                    : option.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setBillingFilter("ALL");
                setSortColumn("name");
                setSortDirection("asc");
                reset();
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <EmptyState
          title="No add-ons match the current filters"
          description="Try clearing filters or adjusting the search query."
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                reset();
              }}
              placeholder="Search add-on name, category, billing type"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="addon-billing-filter"
              value={billingFilter}
              onChange={(event) => {
                setBillingFilter(
                  event.target.value as (typeof BILLING_OPTIONS)[number],
                );
                reset();
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {BILLING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL"
                    ? "All billing types"
                    : option.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <select
              value={sortColumn}
              onChange={(event) => {
                setSortColumn(event.target.value as AddonSortColumn);
                reset();
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name">Sort: Name</option>
              <option value="category">Sort: Category</option>
              <option value="billingType">Sort: Billing Type</option>
              <option value="defaultRate">Sort: Default Rate</option>
              <option value="unitOfMeasure">Sort: Unit</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                reset();
              }}
            >
              {sortDirection === "asc" ? "Ascending" : "Descending"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setBillingFilter("ALL");
                setSortColumn("name");
                setSortDirection("asc");
                reset();
              }}
              disabled={searchQuery.length === 0 && billingFilter === "ALL"}
            >
              Reset
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={pagedAddons}
          onRowSelectionChange={(selected) => setSelectedCount(selected)}
        />
        <DataTablePagination
          page={page}
          limit={limit}
          total={sortedAddons.length}
          onPageChange={(nextPage) => setPage(nextPage)}
          onLimitChange={(nextLimit) => setLimit(nextLimit)}
          selectedCount={selectedCount}
        />
      </div>

      <AddonFormSheet
        addon={editTarget}
        isOpen={!!editTarget || isCreating}
        onClose={() => {
          setEditTarget(null);
          setIsCreating(false);
        }}
      />
      <DeleteAddonDialog
        addon={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

export function AddAddonButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Add-on
      </Button>
      <AddonFormSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
