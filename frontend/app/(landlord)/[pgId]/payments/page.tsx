"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { usePropertyGroup } from "@/hooks/usePropertyGroup";
import { usePayments } from "@/features/landlord/hooks/usePayments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatPeso, toDateOrNull, toFiniteNumber } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/tables/DataTablePagination";

const PAYMENT_STATUS_OPTIONS = [
  "ALL",
  "UNPAID",
  "PAID",
  "OVERDUE",
  "PARTIAL",
  "CANCELLED",
] as const;
const PAYMENT_ROWS_PER_PAGE = 10;
type PaymentSortColumn =
  | "tenant"
  | "property"
  | "period"
  | "dueDate"
  | "amountDue"
  | "amountPaid"
  | "status";

export default function PaymentsPage() {
  const { pgId } = usePropertyGroup();
  const { data: payments, isLoading, isFetching, refetch } = usePayments(pgId);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof PAYMENT_STATUS_OPTIONS)[number]>("ALL");
  const [sortColumn, setSortColumn] = useState<PaymentSortColumn>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const formatDateSafe = (value: unknown, pattern: string) => {
    const d = toDateOrNull(value);
    return d ? format(d, pattern) : "—";
  };

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (payments ?? []).filter((payment) => {
      const matchesStatus =
        statusFilter === "ALL" || payment.status === statusFilter;
      const searchable =
        `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName} ${payment.lease.unit.property.propertyName} ${payment.lease.unit.unitName} ${payment.status} ${payment.amountDue} ${payment.amountPaid}`.toLowerCase();
      const matchesSearch = q.length === 0 || searchable.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [payments, searchQuery, statusFilter]);

  const sortedPayments = useMemo(() => {
    const rows = [...filteredPayments];
    const dir = sortDirection === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const getVal = (
        payment: (typeof filteredPayments)[number],
      ): string | number => {
        if (sortColumn === "tenant")
          return `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`.toLowerCase();
        if (sortColumn === "property")
          return `${payment.lease.unit.property.propertyName} ${payment.lease.unit.unitName}`.toLowerCase();
        if (sortColumn === "status") return payment.status.toLowerCase();
        if (sortColumn === "amountDue")
          return toFiniteNumber(payment.amountDue);
        if (sortColumn === "amountPaid")
          return toFiniteNumber(payment.amountPaid);
        if (sortColumn === "period")
          return toDateOrNull(payment.periodStart)?.getTime() ?? 0;
        return toDateOrNull(payment.dueDate)?.getTime() ?? 0;
      };
      const aVal = getVal(a);
      const bVal = getVal(b);
      if (typeof aVal === "number" && typeof bVal === "number")
        return (aVal - bVal) * dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
    return rows;
  }, [filteredPayments, sortColumn, sortDirection]);

  const totalPayments = sortedPayments.length;
  const totalPaymentPages = Math.max(
    1,
    Math.ceil(totalPayments / PAYMENT_ROWS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPaymentPages);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * PAYMENT_ROWS_PER_PAGE;
    return sortedPayments.slice(start, start + PAYMENT_ROWS_PER_PAGE);
  }, [sortedPayments, currentPage]);

  const toggleSort = (column: PaymentSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection(
      column === "dueDate" || column === "period" ? "desc" : "asc",
    );
  };

  const renderSortIcon = (column: PaymentSortColumn) => {
    if (sortColumn !== column)
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
    );
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Payments" description="Track rental payments" />
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <TableSkeleton rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Track rental payments"
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {payments && payments.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="w-12 h-12" />}
          title="No payments yet"
          description="Payments will appear here once leases are created."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by tenant, property, status, amount"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label
                htmlFor="payment-status-filter"
                className="text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Status
              </label>
              <select
                id="payment-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target
                      .value as (typeof PAYMENT_STATUS_OPTIONS)[number],
                  );
                  setPage(1);
                }}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL"
                      ? "All statuses"
                      : status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                disabled={searchQuery.length === 0 && statusFilter === "ALL"}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("tenant")}
                    >
                      Tenant {renderSortIcon("tenant")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("property")}
                    >
                      Property & Unit {renderSortIcon("property")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("period")}
                    >
                      Period {renderSortIcon("period")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("dueDate")}
                    >
                      Due Date {renderSortIcon("dueDate")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("amountDue")}
                    >
                      Amount Due {renderSortIcon("amountDue")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("amountPaid")}
                    >
                      Amount Paid {renderSortIcon("amountPaid")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("status")}
                    >
                      Status {renderSortIcon("status")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.lease.tenant.firstName}{" "}
                      {payment.lease.tenant.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {payment.lease.unit.property.propertyName}
                        </div>
                        <div className="text-slate-500">
                          {payment.lease.unit.unitName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateSafe(payment.periodStart, "MMM dd")} -{" "}
                      {formatDateSafe(payment.periodEnd, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {formatDateSafe(payment.dueDate, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPeso(payment.amountDue)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPeso(payment.amountPaid)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/${pgId}/payments/${payment.id}`)
                            }
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/${pgId}/payments/${payment.id}/record`,
                              )
                            }
                          >
                            Record Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            page={currentPage}
            limit={PAYMENT_ROWS_PER_PAGE}
            total={totalPayments}
            onPageChange={setPage}
            className="mt-0 rounded-t-none border-t-0"
          />
        </div>
      )}
    </>
  );
}
