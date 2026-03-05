'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { DataTable } from '@/components/tables/DataTable';
import { DataTablePagination } from '@/components/tables/DataTablePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import {
  useAdminSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useUpdateSubscriptionPlanStatus,
} from '@/features/admin/hooks/useAdminSubscriptionPlans';
import type { AdminSubscriptionPlan } from '@/types/domain.types';
import type { SubscriptionPlanDto } from '@/lib/validations/admin.schema';
import { getSubscriptionPlansColumns } from './SubscriptionPlansTableColumns';
import { SubscriptionPlanFormSheet } from './SubscriptionPlanFormSheet';
import { DeleteOrDeactivatePlanDialog } from './DeleteOrDeactivatePlanDialog';

export function SubscriptionPlansTable() {
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<AdminSubscriptionPlan | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const pagination = usePagination({ page: 1, limit: 10 });

  const query = useAdminSubscriptionPlans({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch || undefined,
    includeInactive,
    sort: 'createdAt',
    order: 'desc',
  });

  const createMutation = useCreateSubscriptionPlan();
  const updateMutation = useUpdateSubscriptionPlan();
  const statusMutation = useUpdateSubscriptionPlanStatus();

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta ?? { total: 0, page: pagination.page, limit: pagination.limit };

  async function handleCreateOrUpdate(data: SubscriptionPlanDto) {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
      return;
    }
    await createMutation.mutateAsync(data);
  }

  async function handleConfirmStatusToggle() {
    if (!selected) return;
    await statusMutation.mutateAsync({
      id: selected.id,
      status: selected.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    });
  }

  const columns = getSubscriptionPlansColumns({
    onEdit: (plan) => {
      setSelected(plan);
      setFormOpen(true);
    },
    onToggleStatus: (plan) => {
      setSelected(plan);
      setConfirmOpen(true);
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              pagination.reset();
            }}
            placeholder="Search plan name..."
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                pagination.reset();
              }}
              className="h-4 w-4 rounded border-slate-300 text-primary-700"
            />
            Show inactive
          </label>

          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setFormOpen(true);
            }}
            className="h-10 rounded-md bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-600"
          >
            Create Plan
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No subscription plans found" description="Create a new plan to get started." />
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

      <SubscriptionPlanFormSheet
        key={`${selected?.id ?? 'new'}-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={selected}
        onSubmit={handleCreateOrUpdate}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteOrDeactivatePlanDialog
        open={confirmOpen}
        plan={selected}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmStatusToggle}
        loading={statusMutation.isPending}
      />
    </div>
  );
}
