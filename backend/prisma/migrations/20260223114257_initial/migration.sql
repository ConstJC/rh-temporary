-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "user_type_enum" AS ENUM ('SYSTEM_ADMIN', 'LANDLORD', 'TENANT');

-- CreateEnum
CREATE TYPE "property_type_enum" AS ENUM ('BOARDING_HOUSE', 'APARTMENT_BUILDING', 'CONDO', 'SINGLE_FAMILY', 'COMMERCIAL_MIXED', 'OTHER');

-- CreateEnum
CREATE TYPE "unit_type_enum" AS ENUM ('STUDIO', 'BEDROOM', 'ENTIRE_UNIT', 'SHARED_ROOM', 'DORM', 'OTHER');

-- CreateEnum
CREATE TYPE "unit_status_enum" AS ENUM ('AVAILABLE', 'NOT_AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "tenant_status_enum" AS ENUM ('ACTIVE', 'MOVED_OUT', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "lease_type_enum" AS ENUM ('MONTHLY', 'DAILY', 'FIXED');

-- CreateEnum
CREATE TYPE "lease_status_enum" AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "payment_status_enum" AS ENUM ('PAID', 'UNPAID', 'PARTIAL', 'OVERDUE');

-- CreateEnum
CREATE TYPE "payment_method_enum" AS ENUM ('CASH', 'GCASH', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "subscription_status_enum" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "notification_type_enum" AS ENUM ('OVERDUE_ALERT', 'PAYMENT_RECEIVED', 'LEASE_REMINDER', 'GENERAL');

-- CreateEnum
CREATE TYPE "audit_action_enum" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "transaction_status_enum" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "addon_billing_type" AS ENUM ('FIXED_AMENITY', 'FLAT_FEE', 'METERED');

-- CreateEnum
CREATE TYPE "addon_frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "addon_bill_status" AS ENUM ('UNPAID', 'PAID', 'PARTIAL', 'WAIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "userType" "user_type_enum" NOT NULL DEFAULT 'LANDLORD',
    "phone" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateProvince" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Philippines',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_groups" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'PHP',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "createdBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "property_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "org_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_group_members" (
    "id" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "property_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "priceMonthly" DECIMAL(12,2) NOT NULL,
    "propertyLimit" INTEGER NOT NULL DEFAULT 0,
    "unitLimit" INTEGER NOT NULL DEFAULT 0,
    "tenantLimit" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "subscription_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "propertyType" "property_type_enum" NOT NULL,
    "propertyName" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "postalCode" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitType" "unit_type_enum" NOT NULL,
    "unitName" TEXT NOT NULL,
    "monthlyRent" DECIMAL(12,2) NOT NULL,
    "floorNumber" INTEGER,
    "maxOccupants" INTEGER,
    "status" "unit_status_enum" NOT NULL DEFAULT 'AVAILABLE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "internalNotes" TEXT,
    "emergencyContact" JSONB,
    "status" "tenant_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "leaseType" "lease_type_enum" NOT NULL,
    "billingDay" INTEGER NOT NULL DEFAULT 1,
    "advanceMonths" INTEGER NOT NULL DEFAULT 1,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 3,
    "moveInDate" DATE NOT NULL,
    "moveOutDate" DATE,
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "securityDeposit" DECIMAL(12,2) NOT NULL,
    "status" "lease_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "datePaid" DATE,
    "paymentMethod" "payment_method_enum",
    "status" "payment_status_enum" NOT NULL DEFAULT 'UNPAID',
    "paymentDetails" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "initiatedBy" TEXT,
    "transactionRef" TEXT NOT NULL,
    "externalRef" TEXT,
    "gatewayName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "transaction_status_enum" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "providerResponse" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyGroupId" TEXT,
    "type" "notification_type_enum" NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trail" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "action" "audit_action_enum" NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_addon_catalog" (
    "id" TEXT NOT NULL,
    "propertyGroupId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "billingType" "addon_billing_type" NOT NULL,
    "billingFrequency" "addon_frequency",
    "unitOfMeasure" TEXT,
    "defaultRate" DECIMAL(12,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "unit_addon_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_addons" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "addonCatalogId" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "rate" DECIMAL(12,4),
    "isIncluded" BOOLEAN NOT NULL DEFAULT false,
    "meterNumber" TEXT,
    "notes" TEXT,
    "effectiveFrom" DATE NOT NULL,
    "effectiveUntil" DATE,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "unit_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_addon_bills" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "unitAddonId" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "addon_bill_status" NOT NULL DEFAULT 'UNPAID',
    "utilityReadingId" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lease_addon_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_readings" (
    "id" TEXT NOT NULL,
    "unitAddonId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "propertyGroupId" TEXT NOT NULL,
    "readingDate" DATE NOT NULL,
    "previousReading" DECIMAL(12,4) NOT NULL,
    "currentReading" DECIMAL(12,4) NOT NULL,
    "ratePerUnit" DECIMAL(12,4) NOT NULL,
    "readBy" TEXT NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "utility_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "users"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_emailVerificationToken_idx" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "users_resetPasswordToken_idx" ON "users"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "users_userType_idx" ON "users"("userType");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE INDEX "property_groups_createdBy_idx" ON "property_groups"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "org_roles_code_key" ON "org_roles"("code");

-- CreateIndex
CREATE INDEX "property_group_members_userId_idx" ON "property_group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "property_group_members_propertyGroupId_userId_key" ON "property_group_members"("propertyGroupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_planName_key" ON "subscription_plans"("planName");

-- CreateIndex
CREATE INDEX "subscriptions_propertyGroupId_status_idx" ON "subscriptions"("propertyGroupId", "status");

-- CreateIndex
CREATE INDEX "properties_propertyGroupId_idx" ON "properties"("propertyGroupId");

-- CreateIndex
CREATE INDEX "units_propertyId_idx" ON "units"("propertyId");

-- CreateIndex
CREATE INDEX "units_status_idx" ON "units"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_userId_key" ON "tenants"("userId");

-- CreateIndex
CREATE INDEX "tenants_propertyGroupId_status_idx" ON "tenants"("propertyGroupId", "status");

-- CreateIndex
CREATE INDEX "leases_tenantId_idx" ON "leases"("tenantId");

-- CreateIndex
CREATE INDEX "leases_unitId_status_idx" ON "leases"("unitId", "status");

-- CreateIndex
CREATE INDEX "payments_propertyGroupId_status_dueDate_idx" ON "payments"("propertyGroupId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "payments_leaseId_idx" ON "payments"("leaseId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_leaseId_periodStart_key" ON "payments"("leaseId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transactionRef_key" ON "payment_transactions"("transactionRef");

-- CreateIndex
CREATE INDEX "payment_transactions_paymentId_idx" ON "payment_transactions"("paymentId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_propertyGroupId_idx" ON "notifications"("propertyGroupId");

-- CreateIndex
CREATE INDEX "audit_trail_tableName_recordId_idx" ON "audit_trail"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_trail_userId_idx" ON "audit_trail"("userId");

-- CreateIndex
CREATE INDEX "audit_trail_createdAt_idx" ON "audit_trail"("createdAt");

-- CreateIndex
CREATE INDEX "unit_addon_catalog_propertyGroupId_isActive_idx" ON "unit_addon_catalog"("propertyGroupId", "isActive");

-- CreateIndex
CREATE INDEX "unit_addons_unitId_idx" ON "unit_addons"("unitId");

-- CreateIndex
CREATE INDEX "unit_addons_propertyGroupId_idx" ON "unit_addons"("propertyGroupId");

-- CreateIndex
CREATE INDEX "lease_addon_bills_propertyGroupId_status_dueDate_idx" ON "lease_addon_bills"("propertyGroupId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "lease_addon_bills_leaseId_idx" ON "lease_addon_bills"("leaseId");

-- CreateIndex
CREATE UNIQUE INDEX "lease_addon_bills_leaseId_unitAddonId_periodStart_key" ON "lease_addon_bills"("leaseId", "unitAddonId", "periodStart");

-- CreateIndex
CREATE INDEX "utility_readings_unitAddonId_readingDate_idx" ON "utility_readings"("unitAddonId", "readingDate");

-- CreateIndex
CREATE INDEX "utility_readings_leaseId_idx" ON "utility_readings"("leaseId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_groups" ADD CONSTRAINT "property_groups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_group_members" ADD CONSTRAINT "property_group_members_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_group_members" ADD CONSTRAINT "property_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_group_members" ADD CONSTRAINT "property_group_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "org_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_addon_catalog" ADD CONSTRAINT "unit_addon_catalog_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_addons" ADD CONSTRAINT "unit_addons_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_addons" ADD CONSTRAINT "unit_addons_addonCatalogId_fkey" FOREIGN KEY ("addonCatalogId") REFERENCES "unit_addon_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_addons" ADD CONSTRAINT "unit_addons_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_addon_bills" ADD CONSTRAINT "lease_addon_bills_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_addon_bills" ADD CONSTRAINT "lease_addon_bills_unitAddonId_fkey" FOREIGN KEY ("unitAddonId") REFERENCES "unit_addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_addon_bills" ADD CONSTRAINT "lease_addon_bills_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_addon_bills" ADD CONSTRAINT "lease_addon_bills_utilityReadingId_fkey" FOREIGN KEY ("utilityReadingId") REFERENCES "utility_readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_unitAddonId_fkey" FOREIGN KEY ("unitAddonId") REFERENCES "unit_addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_propertyGroupId_fkey" FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_readBy_fkey" FOREIGN KEY ("readBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
