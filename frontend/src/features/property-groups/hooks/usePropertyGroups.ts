'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createPropertyGroup,
  listPropertyGroups,
  updatePropertyGroup,
  type CreatePropertyGroupDto,
  type UpdatePropertyGroupDto,
} from '@/lib/api/property-groups.api';

export const propertyGroupKeys = {
  all: () => ['propertyGroups'] as const,
};

export function usePropertyGroups() {
  return useQuery({
    queryKey: propertyGroupKeys.all(),
    queryFn: listPropertyGroups,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useCreatePropertyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyGroupDto) => createPropertyGroup(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: propertyGroupKeys.all() });
      toast.success('Property group created');
    },
    onError: () => {
      toast.error('Failed to create property group');
    },
  });
}

export function useUpdatePropertyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePropertyGroupDto }) =>
      updatePropertyGroup(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: propertyGroupKeys.all() });
      toast.success('Property group updated');
    },
    onError: () => {
      toast.error('Failed to update property group');
    },
  });
}

