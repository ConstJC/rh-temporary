'use client';

import { SlideOver } from '@/components/common/SlideOver';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { AuditLogEntry } from '@/types/domain.types';
import { formatDate } from '@/lib/utils';

function actionKey(action: string) {
  return `AUDIT_${action}`.toUpperCase();
}

export function AuditDetailSlideOver({
  entry,
  open,
  onClose,
}: {
  entry: AuditLogEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SlideOver open={open} onClose={onClose} title="Audit entry">
      {!entry ? (
        <p className="text-sm text-slate-500">No entry selected.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={actionKey(entry.action)} />
            <span className="text-sm font-semibold text-slate-900">{entry.tableName}</span>
          </div>

          <div className="text-sm text-slate-700">
            <p>
              <span className="font-semibold">Record:</span> {entry.recordId}
            </p>
            <p>
              <span className="font-semibold">Performed by:</span>{' '}
              {entry.performedBy ? entry.performedBy.email : 'System'}
            </p>
            <p>
              <span className="font-semibold">IP:</span> {entry.ipAddress ?? '—'}
            </p>
            <p>
              <span className="font-semibold">Timestamp:</span> {formatDate(entry.createdAt)}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Old values</p>
              <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                {entry.oldValues ? JSON.stringify(entry.oldValues, null, 2) : 'null'}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">New values</p>
              <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                {entry.newValues ? JSON.stringify(entry.newValues, null, 2) : 'null'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

