"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { landlordApi } from "@/lib/api/landlord.api";
import { landlordKeys } from "./landlord-keys";

export function useProperties(pgId: string) {
  return useQuery({
    queryKey: landlordKeys.properties(pgId),
    queryFn: () => landlordApi.getProperties(pgId),
    enabled: !!pgId,
  });
}

export function useProperty(pgId: string, propertyId: string) {
  return useQuery({
    queryKey: landlordKeys.property(pgId, propertyId),
    queryFn: () => landlordApi.getProperty(pgId, propertyId),
    enabled: !!pgId && !!propertyId,
  });
}

export function useCreateProperty(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.createProperty>[1]) =>
      landlordApi.createProperty(pgId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: landlordKeys.properties(pgId),
      });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
      queryClient.invalidateQueries({
        queryKey: landlordKeys.subscription(pgId),
      });
    },
  });
}

export function useUpdateProperty(pgId: string, propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.updateProperty>[2]) =>
      landlordApi.updateProperty(pgId, propertyId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: landlordKeys.properties(pgId),
      });
      queryClient.invalidateQueries({
        queryKey: landlordKeys.property(pgId, propertyId),
      });
    },
  });
}

export function useDeleteProperty(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) =>
      landlordApi.deleteProperty(pgId, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: landlordKeys.properties(pgId),
      });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
      queryClient.invalidateQueries({
        queryKey: landlordKeys.subscription(pgId),
      });
    },
  });
}
