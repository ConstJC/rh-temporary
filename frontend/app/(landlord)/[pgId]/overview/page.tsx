'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { useOverviewStats } from '@/features/landlord/hooks/useOverviewStats';
import { useLeases } from '@/features/landlord/hooks/useLeases';
import { StatCard } from '@/features/landlord/components/StatCard';
import { AlertCard } from '@/features/landlord/components/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Home, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { format } from 'date-fns';
import { formatPeso, toDateOrNull, toFiniteNumber } from '@/lib/utils';

export default function OverviewPage() {
  const { pgId, group } = usePropertyGroup();
  const { data: stats, isLoading } = useOverviewStats(pgId);
  const { data: leases } = useLeases(pgId);
  const router = useRouter();

  const groupName = (group as { groupName?: string; name?: string } | null)?.groupName
    ?? (group as { name?: string } | null)?.name
    ?? 'Property Group';

  const recentLeases = [...(leases ?? [])]
    .sort((a, b) => {
      const aTs = toDateOrNull(a.createdAt)?.getTime() ?? 0;
      const bTs = toDateOrNull(b.createdAt)?.getTime() ?? 0;
      return bTs - aTs;
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Overview" description="KPIs, occupancy, and recent activity" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Overview" description="KPIs, occupancy, and recent activity" />

      <Card className="mt-6 border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-slate-900">{groupName}</p>
          <p className="text-sm text-slate-500">Property Group ID: {pgId}</p>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={toFiniteNumber(stats?.totalProperties)}
          icon={Building2}
          subtitle={`${toFiniteNumber(stats?.totalUnits)} units`}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${toFiniteNumber(stats?.occupancyRate)}%`}
          icon={Home}
          subtitle={`${toFiniteNumber(stats?.occupiedUnits)} of ${toFiniteNumber(stats?.totalUnits)} occupied`}
        />
        <StatCard
          title="Active Tenants"
          value={toFiniteNumber(stats?.activeTenants)}
          icon={Users}
          subtitle={`${toFiniteNumber(stats?.totalTenants)} total`}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatPeso(stats?.totalRevenue)}
          icon={DollarSign}
          subtitle="Current month"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Lease Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeases.length === 0 ? (
              <p className="text-sm text-slate-500">No recent lease records yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLeases.map((lease) => {
                  const createdAt = toDateOrNull(lease.createdAt);
                  return (
                    <button
                      key={lease.id}
                      type="button"
                      onClick={() => router.push(`/${pgId}/leases/${lease.id}`)}
                      className="flex w-full items-start justify-between rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {lease.tenant.firstName} {lease.tenant.lastName}
                        </p>
                        <p className="text-sm text-slate-600">
                          {lease.unit.property.propertyName} • {lease.unit.unitName}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>{lease.status}</p>
                        <p>{createdAt ? format(createdAt, 'MMM dd, yyyy') : '—'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Alerts & Notifications</h2>
          <div className="space-y-4">
            {stats && toFiniteNumber(stats.overduePayments) > 0 && (
              <AlertCard
                type="error"
                title="Overdue Payments"
                message={`${toFiniteNumber(stats.overduePayments)} payment${toFiniteNumber(stats.overduePayments) > 1 ? 's are' : ' is'} overdue and require immediate attention.`}
                action={{
                  label: 'View Payments',
                  onClick: () => router.push(`/${pgId}/payments`),
                }}
              />
            )}
            {stats && toFiniteNumber(stats.pendingPayments) > 0 && (
              <AlertCard
                type="warning"
                title="Pending Payments"
                message={`${toFiniteNumber(stats.pendingPayments)} payment${toFiniteNumber(stats.pendingPayments) > 1 ? 's are' : ' is'} pending.`}
                action={{
                  label: 'View Payments',
                  onClick: () => router.push(`/${pgId}/payments`),
                }}
              />
            )}
            {stats && toFiniteNumber(stats.availableUnits) > 0 && (
              <AlertCard
                type="info"
                title="Available Units"
                message={`${toFiniteNumber(stats.availableUnits)} unit${toFiniteNumber(stats.availableUnits) > 1 ? 's are' : ' is'} available for lease.`}
                action={{
                  label: 'View Properties',
                  onClick: () => router.push(`/${pgId}/properties`),
                }}
              />
            )}
            {stats && toFiniteNumber(stats.overduePayments) === 0 && toFiniteNumber(stats.pendingPayments) === 0 && (
              <AlertCard
                type="info"
                title="All Clear"
                message="No urgent items require your attention at this time."
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
