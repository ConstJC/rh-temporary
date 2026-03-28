"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { AdminUser } from "@/types/domain.types";

export function RecentSignupsTable({ users }: { users: AdminUser[] }) {
  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        header: "Name",
        id: "name",
        accessorFn: (u) => `${u.firstName} ${u.lastName}`,
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => <span className="text-slate-700">{row.original.email}</span>,
      },
      {
        header: "Status",
        id: "status",
        accessorFn: (u) => (u.isActive ? "USER_ACTIVE" : "USER_INACTIVE"),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.isActive ? "USER_ACTIVE" : "USER_INACTIVE"}
          />
        ),
      },
      {
        header: "Joined",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-slate-600">{formatDate(row.original.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Recent Signups</h3>
        <p className="text-sm text-slate-500">
          Last 10 landlord registrations.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={users}
        className="rounded-none border-0"
        enableRowSelection={false}
      />
    </div>
  );
}
