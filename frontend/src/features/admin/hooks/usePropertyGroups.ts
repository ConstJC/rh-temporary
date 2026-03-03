import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, type PropertyGroupFilters } from '@/lib/api/admin.api';

export const adminPropertyGroupKeys = {
  all: () => ['adminPropertyGroups'] as const,
  list: (f: PropertyGroupFilters) => ['adminPropertyGroups', 'list', f] as const,
};

export function useAdminPropertyGroups(filters: PropertyGroupFilters) {
  return useQuery({
    queryKey: adminPropertyGroupKeys.list(filters),
    queryFn: () => adminApi.getPropertyGroups(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpdatePropertyGroupStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'ACTIVE' | 'SUSPENDED'; notes?: string }) =>
      adminApi.updatePropertyGroup(id, { status, notes }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: adminPropertyGroupKeys.all() });
      toast.success(status === 'SUSPENDED' ? 'Property group suspended' : 'Property group reactivated');
    },
    onError: () => toast.error('Failed to update property group'),
  });
}

