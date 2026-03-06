import { apiClient } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { PropertyGroupSummary } from '@/types/domain.types';

export async function listPropertyGroups(): Promise<PropertyGroupSummary[]> {
  const { data } = await apiClient.get<{ data: PropertyGroupSummary[] }>(API_ENDPOINTS.PROPERTY_GROUPS);
  return (data.data ?? []).map((g) => ({
    ...g,
    name: g.name ?? g.groupName ?? '',
  }));
}

export interface CreatePropertyGroupDto {
  name: string;
  currencyCode: string;
  timezone: string;
}

export interface UpdatePropertyGroupDto {
  name?: string;
  currencyCode?: string;
  timezone?: string;
}

export async function createPropertyGroup(payload: CreatePropertyGroupDto): Promise<PropertyGroupSummary> {
  const { data } = await apiClient.post<{ data: PropertyGroupSummary }>(API_ENDPOINTS.PROPERTY_GROUPS, payload);
  return data.data;
}

export async function updatePropertyGroup(id: string, payload: UpdatePropertyGroupDto): Promise<PropertyGroupSummary> {
  const { data } = await apiClient.patch<{ data: PropertyGroupSummary }>(`${API_ENDPOINTS.PROPERTY_GROUPS}/${id}`, payload);
  return data.data;
}
