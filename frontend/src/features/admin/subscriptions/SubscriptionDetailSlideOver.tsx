'use client';

import { SlideOver } from '@/components/common/SlideOver';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { AdminSubscription } from '@/types/domain.types';

export function SubscriptionDetailSlideOver({
  subscription,
  open,
  onClose,
}: {
  subscription: AdminSubscription | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SlideOver open={open} onClose={onClose} title="Subscription details">
      {!subscription ? (
        <p className="text-sm text-slate-500">No subscription selected.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organization</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{subscription.propertyGroup.groupName}</p>
            <p className="mt-1 text-xs text-slate-500">
              Owner: {subscription.propertyGroup.owner.firstName} {subscription.propertyGroup.owner.lastName} ·{' '}
              {subscription.propertyGroup.owner.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={`SUB_${subscription.status}`.toUpperCase()} />
            <StatusBadge status={subscription.plan.name} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price / month</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatCurrency(subscription.plan.priceMonthly, 'PHP')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto-renew</p>
              <p className="mt-1 text-sm text-slate-700">{subscription.autoRenew ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</p>
              <p className="mt-1 text-sm text-slate-700">{formatDate(subscription.startDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expires</p>
              <p className="mt-1 text-sm text-slate-700">
                {subscription.expiresAt ? formatDate(subscription.expiresAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

