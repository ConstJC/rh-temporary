'use client';

import { useState } from 'react';
import { useAdminAddons } from '@/features/admin/hooks/useAdminAddons';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSkeleton, TableSkeleton } from '@/components/common/LoadingSkeleton';
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
import { MoreHorizontal, Plus } from 'lucide-react';
import type { AddonCatalog } from '@/types/domain.types';

export function AddonCatalogTable() {
  const { data: addons, isLoading } = useAdminAddons();
  const [editTarget, setEditTarget] = useState<AddonCatalog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddonCatalog | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Add-on Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Billing Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Default Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {addons.map((addon) => (
                <tr key={addon.id} className="hover:bg-primary-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {addon.name}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-slate-600">
                    {addon.category}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={addon.billingType} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {addon.defaultRate ? `₱${addon.defaultRate}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {addon.unitOfMeasure ?? '—'}
                  </td>
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
