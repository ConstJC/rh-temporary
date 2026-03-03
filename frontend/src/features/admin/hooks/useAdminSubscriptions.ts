import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; priceMonthly: number; maxUnits: number; maxProperties: number }) =>
      adminApi.createSubscriptionPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSubscriptionKeys.all() });
      toast.success('Subscription plan created');
    },
    onError: () => toast.error('Failed to create subscription plan'),
  });
}

