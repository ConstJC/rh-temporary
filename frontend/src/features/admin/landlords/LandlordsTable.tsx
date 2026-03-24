"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { DataTablePagination } from "@/components/tables/DataTablePagination";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import {
  useAdminPropertyGroupDetails,
  useAdminPropertyGroups,
} from "@/features/admin/hooks/usePropertyGroups";
import { getLandlordsColumns } from "./LandlordsTableColumns";
import type { AdminPropertyGroup } from "@/types/domain.types";
import { PropertyGroupDetailSlideOver } from "./PropertyGroupDetailSlideOver";
import { SuspendOrgDialog } from "./SuspendOrgDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function LandlordsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const debouncedSearch = useDebounce(search, 300);
  const pagination = usePagination({ page: 1, limit: 20 });

  const query = useAdminPropertyGroups({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
    sort: "createdAt",
    order: "desc",
  });

  const rows = query.data?.data ?? [];
  console.log(rows);
  const meta = query.data?.meta ?? {
    total: 0,
    page: pagination.page,
    limit: pagination.limit,
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [selected, setSelected] = useState<AdminPropertyGroup | null>(null);
  const detailsQuery = useAdminPropertyGroupDetails(selected?.id, detailOpen);

  const columns = useMemo(
    () =>
      getLandlordsColumns({
        onViewDetails: (g) => {
          setSelected(g);
          setDetailOpen(true);
        },
        onToggleSuspend: (g) => {
          setSelected(g);
          setSuspendOpen(true);
        },
      }),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pagination.reset();
          }}
          placeholder="Search organization or owner email…"
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:max-w-sm"
        />

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            pagination.reset();
          }}
          className="w-44 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void query.refetch();
          }}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No property groups found"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          <DataTable columns={columns} data={rows} />
          <DataTablePagination
            page={meta.page}
            limit={meta.limit}
            total={meta.total}
            onPageChange={(p) => pagination.setPage(p)}
          />
        </>
      )}

      <PropertyGroupDetailSlideOver
        key={`${selected?.id ?? "none"}-${detailOpen ? "open" : "closed"}`}
        group={detailsQuery.data ?? null}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
      <SuspendOrgDialog
        group={selected}
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
      />
    </div>
  );
}
