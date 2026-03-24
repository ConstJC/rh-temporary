"use client";

import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { AuditLogEntry } from "@/types/domain.types";

function actionKey(action: string) {
  return `AUDIT_${action}`.toUpperCase();
}

export function ActivityFeed({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Platform Activity</h3>
        <p className="text-sm text-slate-500">Last 20 audit log entries.</p>
      </div>
      <ul className="divide-y divide-slate-200">
        {entries.map((e) => (
          <li key={e.id} className="px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={actionKey(e.action)} />
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {e.tableName}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {e.performedBy ? e.performedBy.email : "System"} · record{" "}
                  {e.recordId}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {formatDate(e.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
