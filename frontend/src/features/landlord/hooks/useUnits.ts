'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { landlordApi } from '@/lib/api/landlord.api';
import { landlordKeys } from './landlord-keys';

export interface Unit {
  id: string;
  propertyId: string;
  unitType: string;
  unitName: string;
  monthlyRent: number;
  floorNumber?: number;
  maxOccupants?: number;
  status: string;
  isFeatured: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    propertyName: string;
  };
  leases?: Array<{
    id: string;
    status: string;
    tenant: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface CreateUnitDto {
  unitType: string;
  unitName: string;
  monthlyRent: number;
  floorNumber?: number;
  maxOccupants?: number;
  status?: string;
  isFeatured?: boolean;
  metadata?: Record<string, unknown>;
}

export function useUnits(pgId: string, propertyId?: string) {
  return useQuery({
    queryKey: landlordKeys.units(pgId, propertyId),
    queryFn: () => landlordApi.getUnits(pgId, propertyId),
    enabled: !!pgId,
  });
}

export function useUnit(pgId: string, unitId: string) {
  return useQuery({
    queryKey: landlordKeys.unit(pgId, unitId),
    queryFn: () => landlordApi.getUnit(pgId, unitId),
    enabled: !!pgId && !!unitId,
  });
}

export function useCreateUnit(pgId: string, propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.createUnit>[2]) =>
      landlordApi.createUnit(pgId, propertyId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'units', pgId] });
      queryClient.invalidateQueries({ queryKey: landlordKeys.property(pgId, propertyId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}

export function useUpdateUnit(pgId: string, unitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.updateUnit>[2]) =>
      landlordApi.updateUnit(pgId, unitId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'units', pgId] });
      queryClient.invalidateQueries({ queryKey: landlordKeys.unit(pgId, unitId) });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}

export function useDeleteUnit(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (unitId: string) => landlordApi.deleteUnit(pgId, unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'units', pgId] });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}
