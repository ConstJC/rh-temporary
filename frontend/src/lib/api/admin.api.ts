import { apiClient } from './client';
import type {
  AdminPropertyGroup,
  AdminSubscription,
  AdminUser,
  AuditLogEntry,
  PaginatedResponse,
  UserType,
  AddonCatalog,
  DashboardStats,
} from '@/types/domain.types';
import type { AddonDto } from '@/lib/validations/admin.schema';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PropertyGroupFilters extends PaginationParams {
  search?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface SubscriptionFilters extends PaginationParams {
  status?: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
  plan?: string;
}

export interface UserFilters extends PaginationParams {
  userType?: UserType;
  isActive?: boolean;
  search?: string;
}

export interface AuditFilters extends PaginationParams {
  tableName?: string;
  userId?: string;
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  dateFrom?: string;
  dateTo?: string;
}

export const adminApi = {
  // Feature 1 — Dashboard
  getDashboardStats: () =>
    apiClient.get<{ data: DashboardStats }>('/admin/stats').then((r) => r.data.data),

  // Feature 2 — Property Groups
  getPropertyGroups: (filters: PropertyGroupFilters) =>
    apiClient
      .get<PaginatedResponse<AdminPropertyGroup>>('/admin/property-groups', {
        params: filters,
      })
      .then((r) => r.data),

  updatePropertyGroup: (
    id: string,
    data: { status?: 'ACTIVE' | 'SUSPENDED'; notes?: string },
  ) => apiClient.patch(`/admin/property-groups/${id}`, data).then((r) => r.data),

  // Feature 3 — Subscriptions
  getSubscriptions: (filters: SubscriptionFilters) =>
    apiClient
      .get<PaginatedResponse<AdminSubscription>>('/admin/subscriptions', {
        params: filters,
      })
      .then((r) => r.data),

  createSubscriptionPlan: (data: {
    name: string;
    priceMonthly: number;
    maxUnits: number;
    maxProperties: number;
  }) => apiClient.post('/admin/subscription-plans', data).then((r) => r.data),

  // Feature 4 — Users
  getUsers: (filters: UserFilters) =>
    apiClient
      .get<PaginatedResponse<AdminUser>>('/admin/users', { params: filters })
      .then((r) => r.data),

  updateUser: (id: string, data: { isActive?: boolean; userType?: UserType }) =>
    apiClient.patch(`/admin/users/${id}`, data).then((r) => r.data),

  // Feature 5 — Audit log
  getAuditLog: (filters: AuditFilters) =>
    apiClient
      .get<PaginatedResponse<AuditLogEntry>>('/admin/audit', { params: filters })
      .then((r) => r.data),

  // Feature 6 — Add-on Catalog
  getAddons: () =>
    apiClient.get<{ data: AddonCatalog[] }>('/admin/addon-catalog').then((r) => r.data.data),

  createAddon: (body: AddonDto) =>
    apiClient.post('/admin/addon-catalog', body).then((r) => r.data.data),

  updateAddon: (id: string, body: Partial<AddonDto>) =>
    apiClient.patch(`/admin/addon-catalog/${id}`, body).then((r) => r.data.data),

  deleteAddon: (id: string) => apiClient.delete(`/admin/addon-catalog/${id}`),
};

