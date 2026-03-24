import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

interface AccessCacheEntry {
  expiresAt: number;
  value: AccessContext;
}

export interface AccessContext {
  propertyGroupId: string;
  planId: string;
  planName: string;
  accessPolicyVersion: number;
  menus: string[];
  permissions: string[];
  menuSet: Set<string>;
  permissionSet: Set<string>;
}

@Injectable()
export class AccessControlService {
  private readonly cache = new Map<string, AccessCacheEntry>();
  private readonly ttlMs = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async getAccessContext(propertyGroupId: string): Promise<AccessContext> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        propertyGroupId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        subscriptionPlan: {
          select: {
            id: true,
            planName: true,
            accessPolicyVersion: true,
          },
        },
      },
    });

    if (!subscription?.subscriptionPlan) {
      throw new Error('Active subscription plan not found');
    }

    const plan = subscription.subscriptionPlan;
    const cacheKey = `${propertyGroupId}:${plan.accessPolicyVersion}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const [menuRows, permissionRows] = await Promise.all([
      this.prisma.subscriptionPlanMenu.findMany({
        where: {
          subscriptionPlanId: plan.id,
          isEnabled: true,
          deletedAt: null,
          menu: {
            isActive: true,
            deletedAt: null,
          },
        },
        select: { menu: { select: { code: true } } },
      }),
      this.prisma.subscriptionPlanPermission.findMany({
        where: {
          subscriptionPlanId: plan.id,
          isEnabled: true,
          deletedAt: null,
          permission: {
            isActive: true,
            deletedAt: null,
          },
        },
        select: { permission: { select: { code: true } } },
      }),
    ]);

    const menus = menuRows.map((row) => row.menu.code);
    const permissions = permissionRows.map((row) => row.permission.code);

    const value: AccessContext = {
      propertyGroupId,
      planId: plan.id,
      planName: plan.planName,
      accessPolicyVersion: plan.accessPolicyVersion,
      menus,
      permissions,
      menuSet: new Set(menus),
      permissionSet: new Set(permissions),
    };

    this.cache.set(cacheKey, { value, expiresAt: now + this.ttlMs });
    return value;
  }

  async resolvePropertyGroupIdFromRequest(
    request: Request,
  ): Promise<string | null> {
    const params = request.params ?? {};

    if (typeof (request as any).propertyGroupId === 'string') {
      return (request as any).propertyGroupId;
    }
    if (typeof params.pgId === 'string') {
      return params.pgId;
    }

    const routePath =
      typeof request.route?.path === 'string' ? request.route.path : '';

    if (typeof params.id === 'string' && routePath.startsWith('property-groups/:id')) {
      return params.id;
    }

    if (typeof params.propId === 'string') {
      const property = await this.prisma.property.findFirst({
        where: { id: params.propId, deletedAt: null },
        select: { propertyGroupId: true },
      });
      return property?.propertyGroupId ?? null;
    }

    if (typeof params.propertyId === 'string') {
      const property = await this.prisma.property.findFirst({
        where: { id: params.propertyId, deletedAt: null },
        select: { propertyGroupId: true },
      });
      return property?.propertyGroupId ?? null;
    }

    if (typeof params.unitId === 'string') {
      const unit = await this.prisma.unit.findFirst({
        where: { id: params.unitId, deletedAt: null },
        select: { property: { select: { propertyGroupId: true } } },
      });
      return unit?.property.propertyGroupId ?? null;
    }

    if (typeof params.leaseId === 'string') {
      const lease = await this.prisma.lease.findFirst({
        where: { id: params.leaseId, deletedAt: null },
        select: { propertyGroupId: true },
      });
      return lease?.propertyGroupId ?? null;
    }

    const paymentId =
      typeof params.paymentId === 'string'
        ? params.paymentId
        : routePath.startsWith('payments/:id') && typeof params.id === 'string'
          ? params.id
          : null;

    if (paymentId) {
      const payment = await this.prisma.payment.findFirst({
        where: { id: paymentId, deletedAt: null },
        select: { propertyGroupId: true },
      });
      return payment?.propertyGroupId ?? null;
    }

    return null;
  }

  async getMenuCatalog() {
    return this.prisma.featureMenu.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: {
        id: true,
        code: true,
        label: true,
        routePattern: true,
        sortOrder: true,
      },
    });
  }

  async getPermissionCatalog() {
    return this.prisma.featurePermission.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ moduleCode: 'asc' }, { action: 'asc' }],
      select: {
        id: true,
        code: true,
        moduleCode: true,
        action: true,
        description: true,
      },
    });
  }
}
