'use client';

import { useMemo, useState } from 'react';
import { useAdminAddons } from '@/features/admin/hooks/useAdminAddons';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { AddonFormSheet } from './AddonFormSheet';
import { DeleteAddonDialog } from './DeleteAddonDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Search, ArrowUpDown, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import type { AddonCatalog } from '@/types/domain.types';
import { Input } from '@/components/ui/input';

const BILLING_OPTIONS = ['ALL', 'FLAT_FEE', 'METERED', 'FIXED_AMENITY'] as const;
type AddonSortColumn = 'name' | 'category' | 'billingType' | 'defaultRate' | 'unitOfMeasure';

export function AddonCatalogTable() {
  const { data: addons, isLoading, isFetching, refetch } = useAdminAddons();
  const [editTarget, setEditTarget] = useState<AddonCatalog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddonCatalog | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [billingFilter, setBillingFilter] = useState<(typeof BILLING_OPTIONS)[number]>('ALL');
  const [sortColumn, setSortColumn] = useState<AddonSortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAddons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (addons ?? []).filter((addon) => {
      const matchesBilling = billingFilter === 'ALL' || addon.billingType === billingFilter;
      const searchable = `${addon.name} ${addon.category} ${addon.billingType} ${addon.unitOfMeasure ?? ''} ${addon.defaultRate ?? ''}`.toLowerCase();
      const matchesSearch = q.length === 0 || searchable.includes(q);
      return matchesBilling && matchesSearch;
    });
  }, [addons, searchQuery, billingFilter]);

  const sortedAddons = useMemo(() => {
    const rows = [...filteredAddons];
    const dir = sortDirection === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const getVal = (addon: AddonCatalog): string | number => {
        if (sortColumn === 'defaultRate') return Number(addon.defaultRate ?? 0);
        return String(addon[sortColumn] ?? '').toLowerCase();
      };
      const aVal = getVal(a);
      const bVal = getVal(b);
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
    return rows;
  }, [filteredAddons, sortColumn, sortDirection]);

  const toggleSort = (column: AddonSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection('asc');
  };

  const renderSortIcon = (column: AddonSortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
      : <ChevronDown className="h-3.5 w-3.5 text-slate-700" />;
  };

  if (isLoading) return <TableSkeleton />;
  if (!addons?.length)
    return (
      <EmptyState
        title="No add-ons found"
        description="Create your first platform-wide add-on to get started."
      />
    );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white p-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search add-on name, category, billing type"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="addon-billing-filter" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Billing
            </label>
            <select
              id="addon-billing-filter"
              value={billingFilter}
              onChange={(event) => setBillingFilter(event.target.value as (typeof BILLING_OPTIONS)[number])}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {BILLING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? 'All billing types' : option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setBillingFilter('ALL');
              }}
              disabled={searchQuery.length === 0 && billingFilter === 'ALL'}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                      Add-on Name {renderSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('category')}>
                      Category {renderSortIcon('category')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('billingType')}>
                      Billing Type {renderSortIcon('billingType')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('defaultRate')}>
                      Default Rate {renderSortIcon('defaultRate')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('unitOfMeasure')}>
                      Unit {renderSortIcon('unitOfMeasure')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAddons.map((addon) => (
                  <tr key={addon.id} className="hover:bg-primary-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{addon.name}</td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-600">{addon.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={addon.billingType} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {addon.defaultRate ? `₱${addon.defaultRate}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{addon.unitOfMeasure ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditTarget(addon)}>
                            Edit Add-on
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-danger-600"
                            onClick={() => setDeleteTarget(addon)}
                          >
                            Delete Add-on
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddonFormSheet
        addon={editTarget}
        isOpen={!!editTarget || isCreating}
        onClose={() => {
          setEditTarget(null);
          setIsCreating(false);
        }}
      />
      <DeleteAddonDialog addon={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}

export function AddAddonButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Add-on
      </Button>
      <AddonFormSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
