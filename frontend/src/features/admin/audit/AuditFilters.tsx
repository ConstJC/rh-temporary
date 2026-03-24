"use client";

import type { AuditAction } from "@/types/domain.types";

export function AuditFilters({
  tableName,
  setTableName,
  action,
  setAction,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: {
  tableName: string;
  setTableName: (v: string) => void;
  action: AuditAction | "";
  setAction: (v: AuditAction | "") => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:flex-wrap">
      <input
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
        placeholder="Table name…"
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-52"
      />

      <select
        value={action}
        onChange={(e) => setAction(e.target.value as AuditAction | "")}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
      >
        <option value="">All actions</option>
        <option value="INSERT">INSERT</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
      </select>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
      </div>
    </div>
  );
}
