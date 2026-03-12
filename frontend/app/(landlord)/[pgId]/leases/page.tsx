'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { useLeases } from '@/features/landlord/hooks/useLeases';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Search, ArrowUpDown, ChevronUp, ChevronDown, RefreshCw, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatPeso, toDateOrNull, toFiniteNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const LEASE_STATUS_OPTIONS = ['ALL', 'ACTIVE', 'EXPIRED', 'CLOSED'] as const;
type LeaseSortColumn = 'tenant' | 'property' | 'type' | 'moveInDate' | 'rentAmount' | 'status';

export default function LeasesPage() {
  const { pgId } = usePropertyGroup();
  const { data: leases, isLoading, isFetching, refetch } = useLeases(pgId);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof LEASE_STATUS_OPTIONS)[number]>('ALL');
  const [sortColumn, setSortColumn] = useState<LeaseSortColumn>('moveInDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatDateSafe = (value: unknown, pattern: string) => {
    const d = toDateOrNull(value);
    return d ? format(d, pattern) : '—';
  };

  const filteredLeases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (leases ?? []).filter((lease) => {
      const matchesStatus = statusFilter === 'ALL' || lease.status === statusFilter;
      const searchable = `${lease.tenant.firstName} ${lease.tenant.lastName} ${lease.unit.property.propertyName} ${lease.unit.unitName} ${lease.leaseType} ${lease.status} ${lease.rentAmount}`.toLowerCase();
      const matchesSearch = q.length === 0 || searchable.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [leases, searchQuery, statusFilter]);

  const sortedLeases = useMemo(() => {
    const rows = [...filteredLeases];
    const dir = sortDirection === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const getVal = (lease: (typeof filteredLeases)[number]): string | number => {
        if (sortColumn === 'tenant') return `${lease.tenant.firstName} ${lease.tenant.lastName}`.toLowerCase();
        if (sortColumn === 'property') return `${lease.unit.property.propertyName} ${lease.unit.unitName}`.toLowerCase();
        if (sortColumn === 'type') return lease.leaseType.toLowerCase();
        if (sortColumn === 'rentAmount') return toFiniteNumber(lease.rentAmount);
        if (sortColumn === 'status') return lease.status.toLowerCase();
        return toDateOrNull(lease.moveInDate)?.getTime() ?? 0;
      };
      const aVal = getVal(a);
      const bVal = getVal(b);
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
    return rows;
  }, [filteredLeases, sortColumn, sortDirection]);

  const toggleSort = (column: LeaseSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === 'moveInDate' ? 'desc' : 'asc');
  };

  const renderSortIcon = (column: LeaseSortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
      : <ChevronDown className="h-3.5 w-3.5 text-slate-700" />;
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Tenant Leases" description="Manage tenant leases and assignments" />
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <TableSkeleton rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tenant Leases"
        description="Manage tenant leases and assignments"
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
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => router.push(`/${pgId}/tenants/new`)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
            <Button onClick={() => router.push(`/${pgId}/leases/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Lease
            </Button>
          </div>
        }
      />

      {leases && leases.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No tenant leases yet"
          description="Start by adding a tenant or creating your first lease agreement."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/${pgId}/tenants/new`)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
              <Button onClick={() => router.push(`/${pgId}/leases/new`)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Lease
              </Button>
            </div>
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
                placeholder="Search by tenant, property, unit, lease type"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="lease-status-filter" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                id="lease-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as (typeof LEASE_STATUS_OPTIONS)[number])}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {LEASE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All statuses' : status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                disabled={searchQuery.length === 0 && statusFilter === 'ALL'}
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
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('tenant')}>
                      Tenant {renderSortIcon('tenant')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('property')}>
                      Property & Unit {renderSortIcon('property')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('type')}>
                      Lease Type {renderSortIcon('type')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('moveInDate')}>
                      Move-in Date {renderSortIcon('moveInDate')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('rentAmount')}>
                      Rent Amount {renderSortIcon('rentAmount')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('status')}>
                      Status {renderSortIcon('status')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeases.map((lease) => (
                  <TableRow
                    key={lease.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/${pgId}/leases/${lease.id}`)}
                  >
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${pgId}/tenants/${lease.tenant.id}`);
                        }}
                      >
                        {lease.tenant.firstName} {lease.tenant.lastName}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{lease.unit.property.propertyName}</div>
                        <div className="text-slate-500">{lease.unit.unitName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lease.leaseType}</Badge>
                    </TableCell>
                    <TableCell>{formatDateSafe(lease.moveInDate, 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{formatPeso(lease.rentAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={lease.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${pgId}/leases/${lease.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
