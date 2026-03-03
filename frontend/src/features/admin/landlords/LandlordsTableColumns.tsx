'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { AdminPropertyGroup } from '@/types/domain.types';

function subKey(status: string) {
  return `SUB_${status}`.toUpperCase();
}

export function getLandlordsColumns({
  onViewDetails,
  onToggleSuspend,
}: {
  onViewDetails: (g: AdminPropertyGroup) => void;
  onToggleSuspend: (g: AdminPropertyGroup) => void;
}): ColumnDef<AdminPropertyGroup>[] {
  return [
    {
      header: 'Organization Name',
      accessorKey: 'groupName',
      cell: ({ row }) => <div className="font-semibold text-slate-900">{row.original.groupName}</div>,
    },
    {
      header: 'Owner Email',
      id: 'ownerEmail',
      cell: ({ row }) => <span className="text-slate-700">{row.original.owner.email}</span>,
    },
    {
      header: 'Plan',
      id: 'plan',
      cell: ({ row }) => <span className="text-slate-700">{row.original.subscription.planName}</span>,
    },
    {
      header: 'Status',
      id: 'status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status === 'SUSPENDED' ? 'USER_INACTIVE' : 'USER_ACTIVE'} />
      ),
    },
    {
      header: 'Sub Status',
      id: 'subStatus',
      cell: ({ row }) => <StatusBadge status={subKey(row.original.subscription.status)} />,
    },
    {
      header: 'Units',
      id: 'units',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original._count.units}</span>,
    },
    {
      header: 'Properties',
      id: 'properties',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original._count.properties}</span>,
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: ({ row }) => <span className="text-slate-600">{formatDate(row.original.createdAt)}</span>,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(row.original)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => onToggleSuspend(row.original)}
            className="rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600"
          >
            {row.original.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
          </button>
        </div>
      ),
    },
  ];
}

