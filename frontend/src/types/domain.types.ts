/**
 * Domain enums and types aligned with backend Prisma schema.
 * Keep in sync with backend generated enums.
 */

export type UserRole = 'ADMIN' | 'USER';
export type UserType = 'SYSTEM_ADMIN' | 'LANDLORD' | 'TENANT';
export type OrgRole = 'OWNER' | 'ADMIN' | 'STAFF';

export type PropertyType =
  | 'BOARDING_HOUSE'
  | 'APARTMENT_BUILDING'
  | 'CONDO'
  | 'SINGLE_FAMILY'
  | 'COMMERCIAL_MIXED'
  | 'OTHER';
export type UnitType = 'STUDIO' | 'BEDROOM' | 'ENTIRE_UNIT' | 'SHARED_ROOM' | 'DORM' | 'OTHER';
export type UnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'NOT_AVAILABLE';
export type TenantStatus = 'ACTIVE' | 'MOVED_OUT' | 'BLACKLISTED';
export type LeaseType = 'MONTHLY' | 'DAILY' | 'FIXED';
export type LeaseStatus = 'ACTIVE' | 'EXPIRED' | 'CLOSED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'GCASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
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
  pgNumber: number;
  pgCode?: string;
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
    pgNumber?: number;
    pgCode?: string;
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
  groupName?: string;
  pgNumber?: number;
  pgCode?: string;
  currencyCode?: string;
  timezone?: string;
  subscription?: {
    status: SubscriptionStatus;
    plan?: {
      planName?: string;
      propertyLimit?: number;
      unitLimit?: number;
      tenantLimit?: number;
    };
  };
}

// ── Landlord portal types (LANDLORD) ────────────────────────────────────────────

export interface OverviewStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  occupancyRate: number;
}

export interface PropertyGroupSubscription {
  status: SubscriptionStatus;
  plan: {
    planName: string;
    propertyLimit: number;
    unitLimit: number;
    tenantLimit: number;
  };
  usage: {
    properties: number;
    units: number;
    tenants: number;
  };
}

export interface Property {
  id: string;
  propertyGroupId: string;
  propertyType: PropertyType;
  propertyName: string;
  addressLine: string;
  city: string;
  province?: string;
  postalCode?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    units: number;
  };
}

export interface Unit {
  id: string;
  propertyId: string;
  unitType: UnitType;
  unitName: string;
  monthlyRent: number;
  floorNumber?: number;
  maxOccupants?: number;
  status: UnitStatus;
  isFeatured: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    propertyName: string;
  };
  activeTenantName?: string | null;
  leases?: Array<{
    id: string;
    status: string;
    tenant: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface Tenant {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  internalNotes?: string;
  emergencyContact?: Record<string, any>;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  leases?: Array<{
    id: string;
    status: string;
    unit: {
      unitName: string;
      property: {
        propertyName: string;
      };
    };
  }>;
}

export interface Lease {
  id: string;
  propertyGroupId?: string;
  propertyId?: string;
  tenantId: string;
  unitId: string;
  leaseType: LeaseType;
  billingDay: number;
  advanceMonths: number;
  gracePeriodDays: number;
  moveInDate: string;
  moveOutDate?: string;
  rentAmount: number;
  securityDeposit: number;
  status: LeaseStatus;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  unit: {
    id: string;
    unitName: string;
    property: {
      id: string;
      propertyName: string;
    };
  };
  payments?: Array<{
    id: string;
    status: string;
    amountDue: number;
    amountPaid: number;
    dueDate: string;
  }>;
}

export interface Payment {
  id: string;
  leaseId: string;
  propertyGroupId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  datePaid?: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  paymentDetails?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lease: {
    id: string;
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
    };
    unit: {
      id: string;
      unitName: string;
      property: {
        id: string;
        propertyName: string;
      };
    };
  };
}

// ── DTOs for creating/updating entities ──────────────────────────────────────────

export interface CreatePropertyDto {
  propertyType: PropertyType;
  propertyName: string;
  addressLine: string;
  city: string;
  province?: string;
  postalCode?: string;
  metadata?: Record<string, any>;
}

export interface CreateUnitDto {
  unitType: UnitType;
  unitName: string;
  monthlyRent: number;
  floorNumber?: number;
  maxOccupants?: number;
  status?: UnitStatus;
  isFeatured?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateTenantDto {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  internalNotes?: string;
  emergencyContact?: Record<string, any>;
}

export interface CreateLeaseDto {
  tenantId: string;
  unitId: string;
  leaseType: LeaseType;
  billingDay?: number;
  advanceMonths?: number;
  gracePeriodDays?: number;
  moveInDate: string;
  moveOutDate?: string;
  rentAmount: number;
  securityDeposit: number;
}

export interface RecordPaymentDto {
  amountPaid: number;
  datePaid: string;
  paymentMethod: PaymentMethod;
  paymentDetails?: Record<string, any>;
}
