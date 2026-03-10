import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';

export const adminDashboardKeys = {
  all: () => ['adminDashboard'] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all(),
    queryFn: async () => {
      const [recentOrgs, recentLandlords, subs, activeSubs, audit, paymentAudit] = await Promise.all([
        adminApi.getPropertyGroups({ page: 1, limit: 5, sort: 'createdAt', order: 'desc' }),
        adminApi.getUsers({ page: 1, limit: 10, sort: 'createdAt', order: 'desc', userType: 'LANDLORD' }),
        adminApi.getSubscriptions({ page: 1, limit: 50 }),
        adminApi.getSubscriptions({ page: 1, limit: 1, status: 'ACTIVE' }),
        adminApi.getAuditLog({ page: 1, limit: 20 }),
        adminApi.getAuditLog({ page: 1, limit: 200, tableName: 'payment_transactions', action: 'UPDATE' }),
      ]);

      const activeSubscriptions = subs.data.filter((s) => s.status === 'ACTIVE');
      const monthlyRevenue = activeSubscriptions.reduce((sum, s) => sum + s.plan.priceMonthly, 0);
      const totalSubs = subs.data.length;
      const churnedCount = subs.data.filter((s) => s.status === 'CANCELLED' || s.status === 'EXPIRED').length;
      const churnRate = totalSubs === 0 ? 0 : (churnedCount / totalSubs) * 100;

      const upcomingRenewals = activeSubscriptions.filter((s) => {
        if (!s.expiresAt) return false;
        const exp = new Date(s.expiresAt).getTime();
        const now = Date.now();
        const in30 = now + 30 * 24 * 60 * 60 * 1000;
        return exp > now && exp <= in30;
      }).length;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const failedPayments = paymentAudit.data.filter((entry) => {
        const createdAt = new Date(entry.createdAt).getTime();
        if (Number.isNaN(createdAt) || createdAt < monthStart) return false;
        const newValues = entry.newValues as { status?: string } | null;
        const oldValues = entry.oldValues as { status?: string } | null;
        return oldValues?.status !== 'FAILED' && newValues?.status === 'FAILED';
      }).length;

      return {
        recentOrgs,
        recentLandlords,
        subs,
        activeSubscriptionsTotal: activeSubs.meta.total,
        audit,
        monthlyRevenue,
        churnRate,
        upcomingRenewals,
        failedPayments,
      };
    },
    staleTime: 15_000,
  });
}
