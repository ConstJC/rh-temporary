"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminSubscription } from "@/types/domain.types";

function subKey(status: string) {
  return `SUB_${status}`.toUpperCase();
}

export function getSubscriptionsColumns({
  onViewDetails,
}: {
  onViewDetails: (s: AdminSubscription) => void;
}): ColumnDef<AdminSubscription>[] {
  return [
    {
      header: "Org Name",
      id: "orgName",
      accessorFn: (s) => s.propertyGroup.groupName,
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">
          {row.original.propertyGroup.groupName}
        </span>
      ),
    },
    {
      header: "Plan",
      id: "plan",
      accessorFn: (s) => s.plan.name,
      cell: ({ row }) => (
        <span className="text-slate-700">{row.original.plan.name}</span>
      ),
    },
    {
      header: "Price/mo",
      id: "price",
      accessorFn: (s) => s.plan.priceMonthly,
      cell: ({ row }) => (
        <span className="text-slate-700">
          {formatCurrency(row.original.plan.priceMonthly, "PHP")}
        </span>
      ),
    },
    {
      header: "Status",
      id: "status",
      accessorFn: (s) => subKey(s.status),
      cell: ({ row }) => <StatusBadge status={subKey(row.original.status)} />,
    },
    {
      header: "Start Date",
      id: "startDate",
      accessorFn: (s) => s.startDate,
      cell: ({ row }) => (
        <span className="text-slate-600">
          {formatDate(row.original.startDate)}
        </span>
      ),
    },
    {
      header: "Expiry Date",
      id: "expiresAt",
      accessorFn: (s) => s.expiresAt ?? "",
      cell: ({ row }) =>
        row.original.expiresAt ? (
          <span className="text-slate-600">
            {formatDate(row.original.expiresAt)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      header: "Auto-renew",
      id: "autoRenew",
      accessorFn: (s) => (s.autoRenew ? 1 : 0),
      cell: ({ row }) => (
        <span className="text-slate-700">
          {row.original.autoRenew ? "Yes" : "No"}
        </span>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onViewDetails(row.original)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View
          </button>
        </div>
      ),
    },
  ];
}
