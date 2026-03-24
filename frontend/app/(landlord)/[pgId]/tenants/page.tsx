"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { usePropertyGroup } from "@/hooks/usePropertyGroup";
import { useTenants } from "@/features/landlord/hooks/useTenants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Mail,
  Phone,
  Users,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import type { Tenant } from "@/types/domain.types";

const TENANT_STATUS_OPTIONS = [
  "ALL",
  "ACTIVE",
  "MOVED_OUT",
  "BLACKLISTED",
] as const;
type TenantSortColumn = "name" | "email" | "phone" | "status" | "lease";

export default function TenantsPage() {
  const { pgId } = usePropertyGroup();
  const { data: tenants, isLoading, isFetching, refetch } = useTenants(pgId);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof TENANT_STATUS_OPTIONS)[number]>("ALL");
  const [sortColumn, setSortColumn] = useState<TenantSortColumn>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const getActiveLease = useCallback(
    (tenant: Tenant) => tenant?.leases?.find((l) => l?.status === "ACTIVE"),
    [],
  );

  const filteredTenants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (tenants ?? []).filter((tenant) => {
      const matchesStatus =
        statusFilter === "ALL" || tenant.status === statusFilter;
      const latestLease = tenant.leases?.[0];
      const searchable =
        `${tenant.firstName} ${tenant.lastName} ${tenant.email ?? ""} ${tenant.phone ?? ""} ${tenant.status} ${latestLease?.unit?.property?.propertyName ?? ""} ${latestLease?.unit?.unitName ?? ""}`.toLowerCase();
      const matchesSearch = q.length === 0 || searchable.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [tenants, searchQuery, statusFilter]);

  const sortedTenants = useMemo(() => {
    const rows = [...filteredTenants];
    const dir = sortDirection === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const getVal = (tenant: Tenant): string => {
        if (sortColumn === "name")
          return `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
        if (sortColumn === "email") return (tenant.email ?? "").toLowerCase();
        if (sortColumn === "phone") return (tenant.phone ?? "").toLowerCase();
        if (sortColumn === "status") return tenant.status.toLowerCase();
        const latestLease = tenant.leases?.[0];
        return `${latestLease?.unit?.property?.propertyName ?? ""} ${latestLease?.unit?.unitName ?? ""}`.toLowerCase();
      };
      return getVal(a).localeCompare(getVal(b)) * dir;
    });
    return rows;
  }, [filteredTenants, sortColumn, sortDirection]);

  const toggleSort = (column: TenantSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
  };

  const renderSortIcon = (column: TenantSortColumn) => {
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
        <PageHeader title="Tenants" description="Manage your tenants" />
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <TableSkeleton rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage your tenants"
        action={
          <div className="flex items-center gap-2">
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
            <Button onClick={() => router.push(`/${pgId}/tenants/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
          </div>
        }
      />

      {tenants && tenants.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No tenants yet"
          description="Get started by adding your first tenant."
          action={
            <Button onClick={() => router.push(`/${pgId}/tenants/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
          }
          className="mt-6"
        />
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by tenant, email, phone, property, unit"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label
                htmlFor="tenant-status-filter"
                className="text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Status
              </label>
              <select
                id="tenant-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as (typeof TENANT_STATUS_OPTIONS)[number],
                  )
                }
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {TENANT_STATUS_OPTIONS.map((status) => (
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
                      onClick={() => toggleSort("name")}
                    >
                      Name {renderSortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("email")}
                    >
                      Contact {renderSortIcon("email")}
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
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("lease")}
                    >
                      Property & Unit {renderSortIcon("lease")}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTenants.map((tenant) => {
                  const activeLease = getActiveLease(tenant);
                  const leaseToDisplay = activeLease ?? tenant.leases?.[0];
                  return (
                    <TableRow
                      key={tenant.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/${pgId}/tenants/${tenant.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        {tenant.firstName} {tenant.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {tenant.email && (
                            <div className="flex items-center text-sm text-slate-600">
                              <Mail className="w-3 h-3 mr-1" />
                              {tenant.email}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {tenant.phone ?? "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tenant.status} />
                      </TableCell>
                      <TableCell>
                        {leaseToDisplay ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {leaseToDisplay.unit?.property?.propertyName ??
                                "Unknown Property"}
                            </div>
                            <div className="text-slate-500">
                              {leaseToDisplay.unit?.unitName ?? "Unknown Unit"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">
                            No lease
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${pgId}/tenants/${tenant.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
