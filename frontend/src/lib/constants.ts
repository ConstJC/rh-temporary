/**
 * App-wide constants. API_URL from env at runtime.
 */

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  DASHBOARD: "/dashboard",
  LANDLORD_OVERVIEW: (pgId: string) => `/${pgId}/overview`,
} as const;

export const PLAN_LIMITS = {
  FREE_PROPERTIES: 3,
  FREE_UNITS: 10,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    VERIFY_EMAIL: "/auth/verify-email",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  PROPERTY_GROUPS: "/property-groups",
  tenants: (pgId: string) => `/property-groups/${pgId}/tenants`,
  tenant: (pgId: string, tenantId: string) =>
    `/property-groups/${pgId}/tenants/${tenantId}`,
} as const;
