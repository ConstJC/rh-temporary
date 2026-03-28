"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { DataTablePagination } from "@/components/tables/DataTablePagination";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { usePagination } from "@/hooks/usePagination";
import { useAuditLog } from "@/features/admin/hooks/useAuditLog";
import { getAuditColumns } from "./AuditLogTableColumns";
import type { AuditAction, AuditLogEntry } from "@/types/domain.types";
import { AuditFilters } from "./AuditFilters";
import { AuditDetailSlideOver } from "./AuditDetailSlideOver";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function AuditLogTable() {
  const pagination = usePagination({ page: 1, limit: 50 });
  const [selectedCount, setSelectedCount] = useState(0);

  const [tableName, setTableName] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const query = useAuditLog({
    page: pagination.page,
    limit: pagination.limit,
    tableName: tableName || undefined,
    action: action || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta ?? {
    total: 0,
    page: pagination.page,
    limit: pagination.limit,
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const columns = useMemo(() => getAuditColumns(), []);

  return (
    <div className="space-y-4">
      <AuditFilters
        tableName={tableName}
        setTableName={(v) => {
          setTableName(v);
          pagination.reset();
        }}
        action={action}
        setAction={(v) => {
          setAction(v);
          pagination.reset();
        }}
        dateFrom={dateFrom}
        setDateFrom={(v) => {
          setDateFrom(v);
          pagination.reset();
        }}
        dateTo={dateTo}
        setDateTo={(v) => {
          setDateTo(v);
          pagination.reset();
        }}
      />

      <div className="flex justify-end">
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
        <TableSkeleton rows={8} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No audit entries found"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            onRowSelectionChange={(selected) => setSelectedCount(selected)}
            onRowClick={(r) => {
              setSelected(r);
              setDetailOpen(true);
            }}
          />

          <DataTablePagination
            page={meta.page}
            limit={meta.limit}
            total={meta.total}
            onPageChange={(p) => pagination.setPage(p)}
            onLimitChange={(nextLimit) => pagination.setLimit(nextLimit)}
            selectedCount={selectedCount}
          />
        </>
      )}

      <AuditDetailSlideOver
        entry={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
