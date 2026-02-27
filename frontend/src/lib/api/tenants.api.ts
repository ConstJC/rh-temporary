import { apiClient } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Tenant } from '@/types/domain.types';
import type { PaginatedResponse } from '@/types/api.types';

export interface ListTenantsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export async function listTenants(
  pgId: string,
  params?: ListTenantsParams
): Promise<PaginatedResponse<Tenant>> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  const qs = searchParams.toString();
  const url = API_ENDPOINTS.tenants(pgId) + (qs ? `?${qs}` : '');
  const { data } = await apiClient.get<{ data: Tenant[]; meta: { page: number; limit: number; total: number } }>(url);
  return {
    data: data.data ?? [],
    meta: data.meta ?? { page: 1, limit: 20, total: 0 },
  };
}

export async function getTenant(pgId: string, tenantId: string): Promise<Tenant> {
  const { data } = await apiClient.get<{ data: Tenant }>(API_ENDPOINTS.tenant(pgId, tenantId));
  return data.data;
}

export interface CreateTenantDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  emergencyContact?: { name: string; phone: string; relation: string };
}

export async function createTenant(pgId: string, dto: CreateTenantDto): Promise<Tenant> {
  const { data } = await apiClient.post<{ data: Tenant }>(API_ENDPOINTS.tenants(pgId), dto);
  return data.data;
}

export interface UpdateTenantDto {
  phone?: string;
  status?: string;
  internalNotes?: string;
}

export async function updateTenant(
  pgId: string,
  tenantId: string,
  dto: UpdateTenantDto
): Promise<Tenant> {
  const { data } = await apiClient.patch<{ data: Tenant }>(
    API_ENDPOINTS.tenant(pgId, tenantId),
    dto
  );
  return data.data;
}
