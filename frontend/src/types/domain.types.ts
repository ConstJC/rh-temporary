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
export type AddonBillingType = 'FLAT_FEE' | 'METERED';

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
  subscription?: { status: SubscriptionStatus };
}
