import { apiClient } from "./client";
import type {
  AdminPropertyGroup,
  AdminPropertyGroupDetail,
  AdminSubscription,
  AdminSubscriptionPlan,
  AdminUser,
  AuditLogEntry,
  PaginatedResponse,
  UserType,
  AddonCatalog,
  DashboardStats,
} from "@/types/domain.types";
import type {
  AddonDto,
  SubscriptionPlanDto,
} from "@/lib/validations/admin.schema";

export interface AccessMenuCatalogItem {
  id: string;
  code: string;
  label: string;
  routePattern: string;
  sortOrder: number;
}

export interface AccessPermissionCatalogItem {
  id: string;
  code: string;
  moduleCode: string;
  action: string;
  description?: string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PropertyGroupFilters extends PaginationParams {
  search?: string;
  status?: "ACTIVE" | "SUSPENDED";
}

export interface SubscriptionFilters extends PaginationParams {
  status?: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED";
  plan?: string;
}

export interface SubscriptionPlanFilters extends PaginationParams {
  search?: string;
  includeInactive?: boolean;
}

export interface UserFilters extends PaginationParams {
  userType?: UserType;
  isActive?: boolean;
  search?: string;
}

export interface AuditFilters extends PaginationParams {
  tableName?: string;
  userId?: string;
  action?: "INSERT" | "UPDATE" | "DELETE";
  dateFrom?: string;
  dateTo?: string;
}

export const adminApi = {
  // Feature 1 — Dashboard
  getDashboardStats: () =>
    apiClient
      .get<{ data: DashboardStats }>("/admin/stats")
      .then((r) => r.data.data),

  // Feature 2 — Property Groups
  getPropertyGroups: (filters: PropertyGroupFilters) =>
    apiClient
      .get<PaginatedResponse<AdminPropertyGroup>>("/admin/property-groups", {
        params: filters,
      })
      .then((r) => r.data),

  getPropertyGroupDetails: (id: string) =>
    apiClient
      .get<AdminPropertyGroupDetail>(`/admin/property-groups/${id}/details`)
      .then((r) => r.data),

  updatePropertyGroup: (
    id: string,
    data: {
      status?: "ACTIVE" | "SUSPENDED";
      notes?: string;
      groupName?: string;
      currencyCode?: string;
      timezone?: string;
    },
  ) =>
    apiClient.patch(`/admin/property-groups/${id}`, data).then((r) => r.data),

  // Feature 3 — Subscriptions
  getSubscriptions: (filters: SubscriptionFilters) =>
    apiClient
      .get<PaginatedResponse<AdminSubscription>>("/admin/subscriptions", {
        params: filters,
      })
      .then((r) => r.data),

  getSubscriptionPlans: (filters: SubscriptionPlanFilters) =>
    apiClient
      .get<PaginatedResponse<AdminSubscriptionPlan>>(
        "/admin/subscription-plans",
        {
          params: filters,
        },
      )
      .then((r) => r.data),

  createSubscriptionPlan: (data: SubscriptionPlanDto) =>
    apiClient.post("/admin/subscription-plans", data).then((r) => r.data),

  updateSubscriptionPlan: (id: string, data: Partial<SubscriptionPlanDto>) =>
    apiClient
      .patch(`/admin/subscription-plans/${id}`, data)
      .then((r) => r.data),

  updateSubscriptionPlanStatus: (id: string, status: "ACTIVE" | "SUSPENDED") =>
    apiClient
      .patch(`/admin/subscription-plans/${id}/status`, { status })
      .then((r) => r.data),

  getAccessMenus: () =>
    apiClient
      .get<{ data: AccessMenuCatalogItem[] }>("/admin/access/menus")
      .then((r) => r.data.data),

  getAccessPermissions: () =>
    apiClient
      .get<{ data: AccessPermissionCatalogItem[] }>("/admin/access/permissions")
      .then((r) => r.data.data),

  // Feature 4 — Users
  getUsers: (filters: UserFilters) =>
    apiClient
      .get<PaginatedResponse<AdminUser>>("/admin/users", { params: filters })
      .then((r) => r.data),

  updateUser: (id: string, data: { isActive?: boolean; userType?: UserType }) =>
    apiClient.patch(`/admin/users/${id}`, data).then((r) => r.data),

  // Feature 5 — Audit log
  getAuditLog: (filters: AuditFilters) =>
    apiClient
      .get<
        PaginatedResponse<AuditLogEntry>
      >("/admin/audit", { params: filters })
      .then((r) => r.data),

  // Feature 6 — Add-on Catalog
  getAddons: () =>
    apiClient
      .get<{ data: AddonCatalog[] }>("/admin/addon-catalog")
      .then((r) => r.data.data),

  createAddon: (body: AddonDto) =>
    apiClient.post("/admin/addon-catalog", body).then((r) => r.data.data),

  updateAddon: (id: string, body: Partial<AddonDto>) =>
    apiClient
      .patch(`/admin/addon-catalog/${id}`, body)
      .then((r) => r.data.data),

  deleteAddon: (id: string) => apiClient.delete(`/admin/addon-catalog/${id}`),
};
