import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';

export const adminDashboardKeys = {
  all: () => ['adminDashboard'] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all(),
    queryFn: async () => {
      const [recentOrgs, recentLandlords, subs, activeSubs, audit] = await Promise.all([
        adminApi.getPropertyGroups({ page: 1, limit: 5, sort: 'createdAt', order: 'desc' }),
        adminApi.getUsers({ page: 1, limit: 10, sort: 'createdAt', order: 'desc', userType: 'LANDLORD' }),
        adminApi.getSubscriptions({ page: 1, limit: 50 }),
        adminApi.getSubscriptions({ page: 1, limit: 1, status: 'ACTIVE' }),
        adminApi.getAuditLog({ page: 1, limit: 20 }),
      ]);

      let platformUnits: number | null = null;
      if (recentOrgs.meta.total <= 500) {
        const all = await adminApi.getPropertyGroups({ page: 1, limit: recentOrgs.meta.total || 1 });
        platformUnits = all.data.reduce((sum, g) => sum + g._count.units, 0);
      }

      const expiringSoon = subs.data.filter((s) => {
        if (!s.expiresAt) return false;
        const exp = new Date(s.expiresAt).getTime();
        const now = Date.now();
        const in7 = now + 7 * 24 * 60 * 60 * 1000;
        return exp > now && exp <= in7;
      }).length;

      return {
        recentOrgs,
        recentLandlords,
        subs,
        activeSubscriptionsTotal: activeSubs.meta.total,
        platformUnits,
        audit,
        expiringSoon,
      };
    },
    staleTime: 15_000,
  });
}

