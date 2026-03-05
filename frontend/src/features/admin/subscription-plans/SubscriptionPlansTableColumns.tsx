'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { AdminSubscriptionPlan } from '@/types/domain.types';

export function getSubscriptionPlansColumns({
  onEdit,
  onToggleStatus,
}: {
  onEdit: (plan: AdminSubscriptionPlan) => void;
  onToggleStatus: (plan: AdminSubscriptionPlan) => void;
}): ColumnDef<AdminSubscriptionPlan>[] {
  return [
    {
      header: 'Plan Name',
      id: 'name',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original.name}</span>,
    },
    {
      header: 'Price / mo',
      id: 'priceMonthly',
      cell: ({ row }) => (
        <span className="text-slate-700">{formatCurrency(row.original.priceMonthly, 'PHP')}</span>
      ),
    },
    {
      header: 'Max Units',
      id: 'maxUnits',
      cell: ({ row }) => <span className="text-slate-700">{row.original.maxUnits}</span>,
    },
    {
      header: 'Max Properties',
      id: 'maxProperties',
      cell: ({ row }) => <span className="text-slate-700">{row.original.maxProperties}</span>,
    },
    {
      header: 'Status',
      id: 'status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Created',
      id: 'createdAt',
      cell: ({ row }) => <span className="text-slate-600">{formatDate(row.original.createdAt)}</span>,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(row.original)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onToggleStatus(row.original)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {row.original.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];
}
