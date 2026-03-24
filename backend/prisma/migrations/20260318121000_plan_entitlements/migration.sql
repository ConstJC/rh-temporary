-- AlterTable
ALTER TABLE "subscription_plans"
ADD COLUMN "unitLimitPerProperty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "accessPolicyVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "feature_menus" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "routePattern" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "feature_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "feature_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_menus" (
    "id" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subscription_plan_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_permissions" (
    "id" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subscription_plan_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_menus_code_key" ON "feature_menus"("code");

-- CreateIndex
CREATE INDEX "feature_menus_isActive_sortOrder_idx" ON "feature_menus"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "feature_permissions_code_key" ON "feature_permissions"("code");

-- CreateIndex
CREATE INDEX "feature_permissions_moduleCode_isActive_idx" ON "feature_permissions"("moduleCode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_menus_subscriptionPlanId_menuId_key" ON "subscription_plan_menus"("subscriptionPlanId", "menuId");

-- CreateIndex
CREATE INDEX "subscription_plan_menus_subscriptionPlanId_idx" ON "subscription_plan_menus"("subscriptionPlanId");

-- CreateIndex
CREATE INDEX "subscription_plan_menus_menuId_idx" ON "subscription_plan_menus"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_permissions_subscriptionPlanId_permissionId_key" ON "subscription_plan_permissions"("subscriptionPlanId", "permissionId");

-- CreateIndex
CREATE INDEX "subscription_plan_permissions_subscriptionPlanId_idx" ON "subscription_plan_permissions"("subscriptionPlanId");

-- CreateIndex
CREATE INDEX "subscription_plan_permissions_permissionId_idx" ON "subscription_plan_permissions"("permissionId");

-- AddForeignKey
ALTER TABLE "subscription_plan_menus" ADD CONSTRAINT "subscription_plan_menus_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_menus" ADD CONSTRAINT "subscription_plan_menus_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "feature_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_permissions" ADD CONSTRAINT "subscription_plan_permissions_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_permissions" ADD CONSTRAINT "subscription_plan_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "feature_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
