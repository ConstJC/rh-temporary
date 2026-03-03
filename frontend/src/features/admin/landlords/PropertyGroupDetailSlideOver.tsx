'use client';

import { SlideOver } from '@/components/common/SlideOver';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { AdminPropertyGroup } from '@/types/domain.types';

export function PropertyGroupDetailSlideOver({
  group,
  open,
  onClose,
}: {
  group: AdminPropertyGroup | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SlideOver open={open} onClose={onClose} title="Property group details">
      {!group ? (
        <p className="text-sm text-slate-500">No property group selected.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Organization
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{group.groupName}</p>
            <p className="mt-1 text-xs text-slate-500">
              {group.currencyCode} · {group.timezone}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={group.status === 'SUSPENDED' ? 'USER_INACTIVE' : 'USER_ACTIVE'} />
            <StatusBadge status={`SUB_${group.subscription.status}`.toUpperCase()} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {group.owner.firstName} {group.owner.lastName}
            </p>
            <p className="text-sm text-slate-700">{group.owner.email}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Properties</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{group._count.properties}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Units</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{group._count.units}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{group._count.members}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</p>
            <p className="mt-1 text-sm text-slate-700">{formatDate(group.createdAt)}</p>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

