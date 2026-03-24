"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { landlordApi } from "@/lib/api/landlord.api";
import { landlordKeys } from "./landlord-keys";

export function useTenants(pgId: string) {
  return useQuery({
    queryKey: landlordKeys.tenants(pgId),
    queryFn: () => landlordApi.getTenants(pgId),
    enabled: !!pgId,
  });
}

export function useTenant(pgId: string, tenantId: string) {
  return useQuery({
    queryKey: landlordKeys.tenant(pgId, tenantId),
    queryFn: () => landlordApi.getTenant(pgId, tenantId),
    enabled: !!pgId && !!tenantId,
  });
}

export function useCreateTenant(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.createTenant>[1]) =>
      landlordApi.createTenant(pgId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.tenants(pgId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}

export function useUpdateTenant(pgId: string, tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.updateTenant>[2]) =>
      landlordApi.updateTenant(pgId, tenantId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.tenants(pgId) });
      queryClient.invalidateQueries({
        queryKey: landlordKeys.tenant(pgId, tenantId),
      });
    },
  });
}

export function useDeleteTenant(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => landlordApi.deleteTenant(pgId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.tenants(pgId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}
