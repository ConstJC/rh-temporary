/**
 * Domain enums and types aligned with backend Prisma schema.
 * Keep in sync with backend generated enums.
 */

export type UserRole = 'ADMIN' | 'USER';
export type UserType = 'SYSTEM_ADMIN' | 'LANDLORD' | 'TENANT';
export type OrgRole = 'OWNER' | 'ADMIN' | 'STAFF';

export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED';
export type UnitType = 'STUDIO' | 'BEDROOM_1' | 'BEDROOM_2' | 'BEDROOM_3' | 'OTHER';
export type UnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'NOT_AVAILABLE';
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
export type LeaseType = 'FIXED' | 'MONTH_TO_MONTH';
export type LeaseStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CLOSED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'GCASH' | 'BANK_TRANSFER' | 'OTHER';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
export type AddonBillingType = 'FLAT_FEE' | 'METERED' | 'FIXED_AMENITY';
export type AddonCategory = 'internet' | 'utility' | 'parking' | 'laundry' | 'security' | 'pet' | 'amenity';
export type OrgStatus = 'ACTIVE' | 'SUSPENDED';

// ── Shared pagination helpers ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

// ── Admin portal enums/types (SYSTEM_ADMIN) ──────────────────────────────────

export type SubStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AdminPropertyGroup {
  id: string;
  groupName: string;
  currencyCode: string;
  timezone: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  subscription: {
    planName: string;
    status: SubStatus;
    expiresAt: string | null;
    maxUnits: number;
    maxProperties: number;
  };
  _count: { properties: number; units: number; members: number };
}

export interface PropertyGroupUnitDetail {
  id: string;
  unitName: string;
  unitType: string;
  status: UnitStatus;
  monthlyRent: number;
}

export interface PropertyGroupPropertyDetail {
  id: string;
  propertyName: string;
  propertyType: PropertyType;
  address: string;
  postalCode: string | null;
  unitCount: number;
  unitStatusCounts: Record<string, number>;
  units: PropertyGroupUnitDetail[];
}

export interface AdminPropertyGroupDetail extends AdminPropertyGroup {
  properties: PropertyGroupPropertyDetail[];
}

export interface AdminSubscription {
  id: string;
  status: SubStatus;
  startDate: string;
  expiresAt: string | null;
  autoRenew: boolean;
  propertyGroup: {
    id: string;
    groupName: string;
    owner: { email: string; firstName: string; lastName: string };
  };
  plan: {
    id: string;
    name: string;
    priceMonthly: number;
    maxUnits: number;
    maxProperties: number;
  };
}

export interface AdminSubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  maxUnits: number;
  maxProperties: number;
  maxTenants?: number;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userType: UserType;
  isActive: boolean;
  isEmailVerified: boolean;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { propertyGroups: number };
}

export interface AuditLogEntry {
  id: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  performedBy: { id: string; email: string; userType: string } | null;
  ipAddress: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface AddonCatalog {
  id: string;
  name: string;
  category: AddonCategory;
  billingType: AddonBillingType;
  unitOfMeasure: string | null;
  defaultRate: number | null;
  isActive: boolean;
  propertyGroupId: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalPropertyGroups: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  activeTenants: number;
  revenueTrend: Array<{ month: string; amount: number }>;
  subscriptionsByPlan: Array<{ plan: string; count: number }>;
  orgRegistrations: Array<{ month: string; count: number }>;
}

export interface LoginUser {
  id: string;
  email: string;
  role: UserRole;
  userType: UserType;
  isEmailVerified: boolean;
}

export interface PropertyGroupSummary {
  id: string;
  name: string;
  currencyCode?: string;
  timezone?: string;
  subscription?: { status: SubscriptionStatus };
}

// ── Minimal entity types used by existing UI ────────────────────────────────

export interface Unit {
  id: string;
  unitType: string;
  unitName: string;
  monthlyRent: number | string;
  status: UnitStatus;
  activeTenantName?: string | null;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  status: TenantStatus | string;
  createdAt?: string;
}
