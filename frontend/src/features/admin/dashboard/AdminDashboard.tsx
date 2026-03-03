'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard';
import { KpiCard } from './KpiCard';
import { RecentSignupsTable } from './RecentSignupsTable';
import { ActivityFeed } from './ActivityFeed';
import { PlanBreakdownChart } from './PlanBreakdownChart';

export function AdminDashboard() {
  const query = useAdminDashboard();

  if (query.isLoading) {
    return <TableSkeleton rows={8} />;
  }

  if (!query.data) {
    return <EmptyState title="Failed to load dashboard" description="Please try again." />;
  }

  const { recentLandlords, recentOrgs, subs, audit, activeSubscriptionsTotal, platformUnits, expiringSoon } =
    query.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Landlord Accounts" value={recentLandlords.meta.total} />
        <KpiCard label="Total Property Groups" value={recentOrgs.meta.total} />
        <KpiCard label="Active Subscriptions" value={activeSubscriptionsTotal} />
        <KpiCard label="Platform Units" value={platformUnits ?? '—'} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentSignupsTable users={recentLandlords.data} />
        <ActivityFeed entries={audit.data} />
      </div>

      <div className="space-y-3">
        {expiringSoon > 0 && (
          <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            <span className="font-semibold">{expiringSoon}</span> subscription{expiringSoon === 1 ? '' : 's'} expiring within 7 days.
          </div>
        )}
        <PlanBreakdownChart subscriptions={subs.data} />
      </div>
    </div>
  );
}

