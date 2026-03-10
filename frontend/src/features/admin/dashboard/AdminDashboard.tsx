'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard';
import { KpiCard } from './KpiCard';
import { RecentSignupsTable } from './RecentSignupsTable';
import { ActivityFeed } from './ActivityFeed';
import { PlanBreakdownChart } from './PlanBreakdownChart';
import { formatCurrency } from '@/lib/utils';

export function AdminDashboard() {
  const query = useAdminDashboard();

  if (query.isLoading) {
    return <TableSkeleton rows={8} />;
  }

  if (!query.data) {
    return <EmptyState title="Failed to load dashboard" description="Please try again." />;
  }

  const {
    recentOrgs,
    recentLandlords,
    subs,
    audit,
    activeSubscriptionsTotal,
    monthlyRevenue,
    churnRate,
    upcomingRenewals,
    failedPayments,
  } =
    query.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Monthly Revenue" value={formatCurrency(monthlyRevenue, 'PHP')} />
        <KpiCard label="Churn Rate" value={`${churnRate.toFixed(1)}%`} />
        <KpiCard label="Total Property Groups" value={recentOrgs.meta.total} />
        <KpiCard label="Active Subscriptions" value={activeSubscriptionsTotal} />
        <KpiCard label="Upcoming Renewals" value={upcomingRenewals} />
        <KpiCard label="Failed Payments" value={failedPayments} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentSignupsTable users={recentLandlords.data} />
        <ActivityFeed entries={audit.data} />
      </div>

      <div className="space-y-3">
        {upcomingRenewals > 0 && (
          <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            <span className="font-semibold">{upcomingRenewals}</span> subscription{upcomingRenewals === 1 ? '' : 's'} expiring within 30 days.
          </div>
        )}
        <PlanBreakdownChart subscriptions={subs.data} />
      </div>
    </div>
  );
}
