'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { landlordApi } from '@/lib/api/landlord.api';
import { landlordKeys } from './landlord-keys';

export function useLeases(pgId: string) {
  return useQuery({
    queryKey: landlordKeys.leases(pgId),
    queryFn: () => landlordApi.getLeases(pgId),
    enabled: !!pgId,
  });
}

export function useLease(pgId: string, leaseId: string) {
  return useQuery({
    queryKey: landlordKeys.lease(pgId, leaseId),
    queryFn: () => landlordApi.getLease(pgId, leaseId),
    enabled: !!pgId && !!leaseId,
  });
}

export function useCreateLease(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.createLease>[1]) =>
      landlordApi.createLease(pgId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leases(pgId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.units(pgId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}

export function useUpdateLease(pgId: string, leaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.updateLease>[2]) =>
      landlordApi.updateLease(pgId, leaseId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leases(pgId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.lease(pgId, leaseId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}

export function useDeleteLease(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaseId: string) => landlordApi.deleteLease(pgId, leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leases(pgId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.units(pgId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}
