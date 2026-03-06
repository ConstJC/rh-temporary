'use client';

import { useQuery } from '@tanstack/react-query';
import { landlordApi } from '@/lib/api/landlord.api';
import { landlordKeys } from './landlord-keys';

export function useOverviewStats(pgId: string) {
  return useQuery({
    queryKey: landlordKeys.overview(pgId),
    queryFn: () => landlordApi.getOverviewStats(pgId),
    enabled: !!pgId,
  });
}

export function useSubscription(pgId: string) {
  return useQuery({
    queryKey: landlordKeys.subscription(pgId),
    queryFn: () => landlordApi.getSubscription(pgId),
    enabled: !!pgId,
  });
}
