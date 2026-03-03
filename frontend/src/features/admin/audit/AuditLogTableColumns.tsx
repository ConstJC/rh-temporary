'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { AuditLogEntry } from '@/types/domain.types';

function actionKey(action: string) {
  return `AUDIT_${action}`.toUpperCase();
}

export function getAuditColumns(): ColumnDef<AuditLogEntry>[] {
  return [
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }) => <StatusBadge status={actionKey(row.original.action)} />,
    },
    {
      header: 'Table',
      accessorKey: 'tableName',
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original.tableName}</span>,
    },
    {
      header: 'Performed By',
      id: 'performedBy',
      cell: ({ row }) =>
        row.original.performedBy ? (
          <span className="text-slate-700">{row.original.performedBy.email}</span>
        ) : (
          <span className="text-slate-400">System</span>
        ),
    },
    {
      header: 'Record ID',
      accessorKey: 'recordId',
      cell: ({ row }) => <span className="text-slate-700">{row.original.recordId}</span>,
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: ({ row }) => <span className="text-slate-600">{row.original.ipAddress ?? '—'}</span>,
    },
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: ({ row }) => <span className="text-slate-600">{formatDate(row.original.createdAt)}</span>,
    },
  ];
}

