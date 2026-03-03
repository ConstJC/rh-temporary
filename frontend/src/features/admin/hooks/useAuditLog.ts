import { useQuery } from '@tanstack/react-query';
import { adminApi, type AuditFilters } from '@/lib/api/admin.api';

export const auditLogKeys = {
  all: () => ['adminAuditLog'] as const,
  list: (f: AuditFilters) => ['adminAuditLog', 'list', f] as const,
};

export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: () => adminApi.getAuditLog(filters),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

