'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { AdminUser } from '@/types/domain.types';

function userStatusKey(u: AdminUser) {
  if (!u.isActive) return 'USER_INACTIVE';
  if (!u.isEmailVerified) return 'USER_UNVERIFIED';
  return 'USER_ACTIVE';
}

export function getUsersColumns({
  currentUserId,
  onViewDetails,
  onToggleStatus,
}: {
  currentUserId?: string;
  onViewDetails: (u: AdminUser) => void;
  onToggleStatus: (u: AdminUser) => void;
}): ColumnDef<AdminUser>[] {
  return [
    {
      header: 'Name',
      accessorFn: (u) => `${u.firstName} ${u.lastName}`,
      cell: ({ row }) => (
        <div className="font-semibold text-slate-900">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => <span className="text-slate-700">{row.original.email}</span>,
    },
    {
      header: 'UserType',
      accessorKey: 'userType',
      cell: ({ row }) => <StatusBadge status={row.original.userType} />,
    },
    {
      header: 'Status',
      id: 'status',
      cell: ({ row }) => <StatusBadge status={userStatusKey(row.original)} />,
    },
    {
      header: 'Email Verified',
      id: 'emailVerified',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isEmailVerified ? 'ACTIVE' : 'PENDING'} />
      ),
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: ({ row }) => <span className="text-slate-600">{formatDate(row.original.createdAt)}</span>,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const u = row.original;
        const canToggle = !currentUserId || u.id !== currentUserId;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onViewDetails(u)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              View
            </button>
            {canToggle && (
              <button
                type="button"
                onClick={() => onToggleStatus(u)}
                className="rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600"
              >
                {u.isActive ? 'Disable' : 'Enable'}
              </button>
            )}
          </div>
        );
      },
    },
  ];
}

