import { apiClient } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { PropertyGroupSummary } from '@/types/domain.types';

export async function listPropertyGroups(): Promise<PropertyGroupSummary[]> {
  const { data } = await apiClient.get<{ data: PropertyGroupSummary[] }>(API_ENDPOINTS.PROPERTY_GROUPS);
  return data.data ?? [];
}
