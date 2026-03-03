import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, type UserFilters } from '@/lib/api/admin.api';
import type { UserType } from '@/types/domain.types';

export const adminUserKeys = {
  all: () => ['adminUsers'] as const,
  list: (f: UserFilters) => ['adminUsers', 'list', f] as const,
};

export function useAdminUsers(filters: UserFilters) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: () => adminApi.getUsers(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUser(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.all() });
      toast.success(isActive ? 'Account enabled' : 'Account disabled');
    },
    onError: () => toast.error('Failed to update user status'),
  });
}

export function useUpdateUserType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userType }: { id: string; userType: UserType }) =>
      adminApi.updateUser(id, { userType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.all() });
      toast.success('User type updated');
    },
    onError: () => toast.error('Failed to update user type'),
  });
}

