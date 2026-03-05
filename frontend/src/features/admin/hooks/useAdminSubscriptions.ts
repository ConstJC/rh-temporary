import { useQuery } from '@tanstack/react-query';
import { adminApi, type SubscriptionFilters } from '@/lib/api/admin.api';

export const adminSubscriptionKeys = {
  all: () => ['adminSubscriptions'] as const,
  list: (f: SubscriptionFilters) => ['adminSubscriptions', 'list', f] as const,
};

export function useAdminSubscriptions(filters: SubscriptionFilters) {
  return useQuery({
    queryKey: adminSubscriptionKeys.list(filters),
    queryFn: () => adminApi.getSubscriptions(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
