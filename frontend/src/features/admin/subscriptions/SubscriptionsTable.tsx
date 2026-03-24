"use client";

import { useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { DataTablePagination } from "@/components/tables/DataTablePagination";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useAdminSubscriptions } from "@/features/admin/hooks/useAdminSubscriptions";
import { getSubscriptionsColumns } from "./SubscriptionsTableColumns";
import type { AdminSubscription, SubStatus } from "@/types/domain.types";
import { SubscriptionDetailSlideOver } from "./SubscriptionDetailSlideOver";
import { PlanBreakdownChart } from "./PlanBreakdownChart";
import { ExpiryAlertBanner } from "./ExpiryAlertBanner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

function expiringIn7Days(expiresAt: string | null) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  const in7 = now + 7 * 24 * 60 * 60 * 1000;
  return exp > now && exp <= in7;
}

export function SubscriptionsTable() {
  const [status, setStatus] = useState<SubStatus | "">("");
  const [plan, setPlan] = useState("");
  const debouncedPlan = useDebounce(plan, 300);
  const pagination = usePagination({ page: 1, limit: 20 });

  const query = useAdminSubscriptions({
    page: pagination.page,
    limit: pagination.limit,
    status: status || undefined,
    plan: debouncedPlan || undefined,
    sort: "startedAt",
    order: "desc",
  });

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta ?? {
    total: 0,
    page: pagination.page,
    limit: pagination.limit,
  };

  const expiringCount = rows.filter((s) => expiringIn7Days(s.expiresAt)).length;

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AdminSubscription | null>(null);

  const columns = getSubscriptionsColumns({
    onViewDetails: (s) => {
      setSelected(s);
      setDetailOpen(true);
    },
  });

  const counts = rows.reduce(
    (acc, s) => {
      acc.total += 1;
      acc.active += s.status === "ACTIVE" ? 1 : 0;
      acc.trial += s.status === "TRIAL" ? 1 : 0;
      acc.expired += s.status === "EXPIRED" ? 1 : 0;
      acc.cancelled += s.status === "CANCELLED" ? 1 : 0;
      return acc;
    },
    { total: 0, active: 0, trial: 0, expired: 0, cancelled: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {counts.active}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Trial
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {counts.trial}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Expired
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {counts.expired}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Expiring (7d)
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {expiringCount}
          </p>
        </div>
      </div>

      <ExpiryAlertBanner count={expiringCount} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[200px_minmax(0,1fr)_auto]">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as SubStatus | "");
                  pagination.reset();
                }}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                <option value="">All status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIAL">TRIAL</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <input
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value);
                  pagination.reset();
                }}
                placeholder="Filter plan…"
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />

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
          </div>

          <div className="mt-4">
            {query.isLoading ? (
              <TableSkeleton rows={6} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="No subscriptions found"
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
          </div>
        </div>

        <PlanBreakdownChart subscriptions={rows} />
      </div>

      <SubscriptionDetailSlideOver
        subscription={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
