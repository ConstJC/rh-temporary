import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserType, SubscriptionStatus } from '../generated/prisma/client';

type Order = 'asc' | 'desc';

function formatPgCode(pgNumber: number) {
  return `PG-${String(pgNumber).padStart(3, '0')}`;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private mapPropertyGroupSummary(group: {
    id: string;
    pgNumber: number;
    groupName: string;
    currencyCode: string;
    timezone: string;
    createdAt: Date;
    deletedAt: Date | null;
    creator: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
    };
    members: { id: string }[];
    properties: Array<{
      id: string;
      _count?: { units: number };
      units?: Array<{ id: string }>;
    }>;
    subscriptions: Array<{
      status: SubscriptionStatus;
      endsAt: Date | null;
      subscriptionPlan: {
        planName: string;
        unitLimit: number;
        propertyLimit: number;
      };
    }>;
  }) {
    const units = group.properties.reduce(
      (sum, p) => sum + (p._count?.units ?? p.units?.length ?? 0),
      0,
    );
    const subscription = group.subscriptions[0];

    return {
      id: group.id,
      pgNumber: group.pgNumber,
      pgCode: formatPgCode(group.pgNumber),
      groupName: group.groupName,
      currencyCode: group.currencyCode,
      timezone: group.timezone,
      status: group.deletedAt ? 'SUSPENDED' : 'ACTIVE',
      createdAt: group.createdAt.toISOString(),
      owner: group.creator,
      subscription: subscription
        ? {
            planName: subscription.subscriptionPlan.planName,
            status: subscription.status as unknown as string,
            expiresAt: subscription.endsAt
              ? subscription.endsAt.toISOString()
              : null,
            maxUnits: subscription.subscriptionPlan.unitLimit,
            maxProperties: subscription.subscriptionPlan.propertyLimit,
          }
        : {
            planName: 'UNKNOWN',
            status: 'EXPIRED',
            expiresAt: null,
            maxUnits: 0,
            maxProperties: 0,
          },
      _count: {
        properties: group.properties.length,
        units,
        members: group.members.length,
      },
    };
  }

  async getUsers(params: {
    page: number;
    limit: number;
    userType?: UserType;
    isActive?: boolean;
    search?: string;
    sort?: string;
    order?: Order;
  }) {
    const { page, limit, userType, isActive, search, sort, order } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (userType) where.userType = userType;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search?.trim()) {
      where.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { firstName: { contains: search.trim(), mode: 'insensitive' } },
        { lastName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const orderBy =
      sort === 'createdAt'
        ? { createdAt: order ?? 'desc' }
        : { createdAt: 'desc' as const };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          userType: true,
          isActive: true,
          isEmailVerified: true,
          phone: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const pgCountMap = new Map<string, number>();
    if (users.length) {
      const pgRows = await this.prisma.propertyGroup.findMany({
        where: { deletedAt: null, createdBy: { in: users.map((u) => u.id) } },
        select: { createdBy: true },
      });
      for (const r of pgRows) {
        pgCountMap.set(r.createdBy, (pgCountMap.get(r.createdBy) ?? 0) + 1);
      }
    }

    return {
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: null as string | null,
        _count: { propertyGroups: pgCountMap.get(u.id) ?? 0 },
      })),
      meta: { total, page, limit },
    };
  }

  async updateUser(
    currentUserId: string,
    id: string,
    data: { isActive?: boolean; userType?: UserType },
  ) {
    if (id === currentUserId && data.isActive === false) {
      throw new BadRequestException('Cannot disable your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(typeof data.isActive === 'boolean'
          ? { isActive: data.isActive }
          : {}),
        ...(data.userType ? { userType: data.userType } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
        isActive: true,
        isEmailVerified: true,
        phone: true,
        createdAt: true,
      },
    });

    const propertyGroups = await this.prisma.propertyGroup.count({
      where: { deletedAt: null, createdBy: updated.id },
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role,
      userType: updated.userType,
      isActive: updated.isActive,
      isEmailVerified: updated.isEmailVerified,
      phone: updated.phone,
      createdAt: updated.createdAt.toISOString(),
      lastLoginAt: null,
      _count: { propertyGroups },
    };
  }

  async getPropertyGroups(params: {
    page: number;
    limit: number;
    search?: string;
    status?: 'ACTIVE' | 'SUSPENDED';
    sort?: string;
    order?: Order;
  }) {
    const { page, limit, search, status, sort, order } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status === 'ACTIVE') where.deletedAt = null;
    if (status === 'SUSPENDED') where.deletedAt = { not: null };
    if (!where.deletedAt) where.deletedAt = null;

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { groupName: { contains: q, mode: 'insensitive' } },
        { creator: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const orderBy =
      sort === 'createdAt'
        ? { createdAt: order ?? 'desc' }
        : { createdAt: 'desc' as const };

    const [groups, total] = await this.prisma.$transaction([
      this.prisma.propertyGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          pgNumber: true,
          groupName: true,
          currencyCode: true,
          timezone: true,
          createdAt: true,
          deletedAt: true,
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
          members: { where: { deletedAt: null }, select: { id: true } },
          properties: {
            where: { deletedAt: null },
            select: { id: true, _count: { select: { units: true } } },
          },
          subscriptions: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status: true,
              startedAt: true,
              endsAt: true,
              subscriptionPlan: {
                select: {
                  planName: true,
                  unitLimit: true,
                  propertyLimit: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.propertyGroup.count({ where }),
    ]);

    return {
      data: groups.map((g) => this.mapPropertyGroupSummary(g)),
      meta: { total, page, limit },
    };
  }

  async getPropertyGroupDetails(id: string) {
    const group = await this.prisma.propertyGroup.findUnique({
      where: { id },
      select: {
        id: true,
        pgNumber: true,
        groupName: true,
        currencyCode: true,
        timezone: true,
        createdAt: true,
        deletedAt: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
        members: { where: { deletedAt: null }, select: { id: true } },
        properties: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            propertyName: true,
            propertyType: true,
            addressLine: true,
            city: true,
            province: true,
            postalCode: true,
            units: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                unitName: true,
                unitType: true,
                monthlyRent: true,
                status: true,
              },
            },
          },
        },
        subscriptions: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            status: true,
            endsAt: true,
            subscriptionPlan: {
              select: {
                planName: true,
                unitLimit: true,
                propertyLimit: true,
              },
            },
          },
        },
      },
    });

    if (!group) throw new NotFoundException('Property group not found');

    return {
      ...this.mapPropertyGroupSummary(group),
      properties: group.properties.map((property) => {
        const unitStatusCounts = property.units.reduce(
          (acc, unit) => {
            acc[unit.status] = (acc[unit.status] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          id: property.id,
          propertyName: property.propertyName,
          propertyType: property.propertyType,
          address: [property.addressLine, property.city, property.province]
            .filter(Boolean)
            .join(', '),
          postalCode: property.postalCode,
          unitCount: property.units.length,
          unitStatusCounts,
          units: property.units.map((unit) => ({
            id: unit.id,
            unitName: unit.unitName,
            unitType: unit.unitType,
            status: unit.status,
            monthlyRent: Number(unit.monthlyRent),
          })),
        };
      }),
    };
  }

  async updatePropertyGroup(
    id: string,
    data: {
      status?: 'ACTIVE' | 'SUSPENDED';
      groupName?: string;
      currencyCode?: string;
      timezone?: string;
      notes?: string;
    },
  ) {
    const pg = await this.prisma.propertyGroup.findUnique({ where: { id } });
    if (!pg) throw new NotFoundException('Property group not found');

    const hasUpdates =
      typeof data.status === 'string' ||
      typeof data.groupName === 'string' ||
      typeof data.currencyCode === 'string' ||
      typeof data.timezone === 'string';
    if (!hasUpdates) return { id };

    const updated = await this.prisma.propertyGroup.update({
      where: { id },
      data: {
        ...(data.status
          ? data.status === 'SUSPENDED'
            ? { deletedAt: new Date() }
            : { deletedAt: null }
          : {}),
        ...(data.groupName ? { groupName: data.groupName.trim() } : {}),
        ...(data.currencyCode
          ? { currencyCode: data.currencyCode.trim().toUpperCase() }
          : {}),
        ...(data.timezone ? { timezone: data.timezone.trim() } : {}),
      },
      select: {
        id: true,
        pgNumber: true,
        groupName: true,
        currencyCode: true,
        timezone: true,
        deletedAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updated.id,
      pgNumber: updated.pgNumber,
      pgCode: formatPgCode(updated.pgNumber),
      groupName: updated.groupName,
      currencyCode: updated.currencyCode,
      timezone: updated.timezone,
      status: updated.deletedAt ? 'SUSPENDED' : 'ACTIVE',
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getSubscriptions(params: {
    page: number;
    limit: number;
    status?: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
    plan?: string;
    sort?: string;
    order?: Order;
  }) {
    const { page, limit, status, plan, sort, order } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (status && status !== 'TRIAL')
      where.status = status as SubscriptionStatus;
    if (plan?.trim()) {
      where.subscriptionPlan = {
        planName: { equals: plan.trim(), mode: 'insensitive' },
      };
    }

    const orderBy =
      sort === 'startedAt'
        ? { startedAt: order ?? 'desc' }
        : { createdAt: 'desc' as const };

    const [subs, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          status: true,
          startedAt: true,
          endsAt: true,
          cancelledAt: true,
          propertyGroup: {
            select: {
              id: true,
              pgNumber: true,
              groupName: true,
              creator: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
          },
          subscriptionPlan: {
            select: {
              id: true,
              planName: true,
              priceMonthly: true,
              unitLimit: true,
              propertyLimit: true,
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: subs.map((s) => ({
        id: s.id,
        status: s.status as unknown as string,
        startDate: s.startedAt.toISOString(),
        expiresAt: s.endsAt ? s.endsAt.toISOString() : null,
        autoRenew: s.cancelledAt == null,
        propertyGroup: {
          id: s.propertyGroup.id,
          pgNumber: s.propertyGroup.pgNumber,
          pgCode: formatPgCode(s.propertyGroup.pgNumber),
          groupName: s.propertyGroup.groupName,
          owner: s.propertyGroup.creator,
        },
        plan: {
          id: s.subscriptionPlan.id,
          name: s.subscriptionPlan.planName,
          priceMonthly: Number(s.subscriptionPlan.priceMonthly),
          maxUnits: s.subscriptionPlan.unitLimit,
          maxProperties: s.subscriptionPlan.propertyLimit,
        },
      })),
      meta: { total, page, limit },
    };
  }

  async createSubscriptionPlan(data: {
    name: string;
    priceMonthly: number;
    maxUnits: number;
    maxProperties: number;
  }) {
    const existing = await this.prisma.subscriptionPlan.findFirst({
      where: { planName: data.name.trim() },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Subscription plan name already exists');
    }

    const created = await this.prisma.subscriptionPlan.create({
      data: {
        planName: data.name.trim(),
        priceMonthly: data.priceMonthly,
        unitLimit: data.maxUnits,
        propertyLimit: data.maxProperties,
        tenantLimit: 0,
      },
      select: {
        id: true,
        planName: true,
        priceMonthly: true,
        unitLimit: true,
        propertyLimit: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return {
      id: created.id,
      name: created.planName,
      priceMonthly: Number(created.priceMonthly),
      maxUnits: created.unitLimit,
      maxProperties: created.propertyLimit,
      status: created.deletedAt ? 'SUSPENDED' : 'ACTIVE',
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async getSubscriptionPlans(params: {
    page: number;
    limit: number;
    search?: string;
    includeInactive?: boolean;
    sort?: string;
    order?: Order;
  }) {
    const { page, limit, search, includeInactive, sort, order } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = includeInactive
      ? {}
      : { deletedAt: null };
    if (search?.trim()) {
      where.planName = { contains: search.trim(), mode: 'insensitive' };
    }

    const orderBy =
      sort === 'priceMonthly'
        ? { priceMonthly: order ?? 'asc' }
        : sort === 'planName'
          ? { planName: order ?? 'asc' }
          : { createdAt: 'desc' as const };

    const [plans, total] = await this.prisma.$transaction([
      this.prisma.subscriptionPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          planName: true,
          priceMonthly: true,
          propertyLimit: true,
          unitLimit: true,
          tenantLimit: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.subscriptionPlan.count({ where }),
    ]);

    return {
      data: plans.map((plan) => ({
        id: plan.id,
        name: plan.planName,
        priceMonthly: Number(plan.priceMonthly),
        maxUnits: plan.unitLimit,
        maxProperties: plan.propertyLimit,
        maxTenants: plan.tenantLimit,
        status: plan.deletedAt ? 'SUSPENDED' : 'ACTIVE',
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      })),
      meta: { total, page, limit },
    };
  }

  async updateSubscriptionPlan(
    id: string,
    data: {
      name?: string;
      priceMonthly?: number;
      maxUnits?: number;
      maxProperties?: number;
    },
  ) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true, planName: true },
    });
    if (!existing) throw new NotFoundException('Subscription plan not found');

    if (data.name && data.name.trim() !== existing.planName) {
      const duplicate = await this.prisma.subscriptionPlan.findFirst({
        where: { planName: data.name.trim(), NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new BadRequestException('Subscription plan name already exists');
      }
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(data.name ? { planName: data.name.trim() } : {}),
        ...(typeof data.priceMonthly === 'number'
          ? { priceMonthly: data.priceMonthly }
          : {}),
        ...(typeof data.maxUnits === 'number'
          ? { unitLimit: data.maxUnits }
          : {}),
        ...(typeof data.maxProperties === 'number'
          ? { propertyLimit: data.maxProperties }
          : {}),
      },
      select: {
        id: true,
        planName: true,
        priceMonthly: true,
        propertyLimit: true,
        unitLimit: true,
        tenantLimit: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return {
      id: updated.id,
      name: updated.planName,
      priceMonthly: Number(updated.priceMonthly),
      maxUnits: updated.unitLimit,
      maxProperties: updated.propertyLimit,
      maxTenants: updated.tenantLimit,
      status: updated.deletedAt ? 'SUSPENDED' : 'ACTIVE',
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async updateSubscriptionPlanStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED',
  ) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Subscription plan not found');

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data:
        status === 'SUSPENDED'
          ? { deletedAt: new Date() }
          : { deletedAt: null },
      select: { id: true, deletedAt: true, updatedAt: true },
    });

    return {
      id: updated.id,
      status: updated.deletedAt ? 'SUSPENDED' : 'ACTIVE',
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getAudit(params: {
    page: number;
    limit: number;
    tableName?: string;
    userId?: string;
    action?: 'INSERT' | 'UPDATE' | 'DELETE';
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page, limit, tableName, userId, action, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (tableName?.trim()) where.tableName = tableName.trim();
    if (userId?.trim()) where.userId = userId.trim();
    if (action) where.action = action;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditTrail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tableName: true,
          recordId: true,
          action: true,
          oldValues: true,
          newValues: true,
          ipAddress: true,
          requestId: true,
          createdAt: true,
          user: { select: { id: true, email: true, userType: true } },
        },
      }),
      this.prisma.auditTrail.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id.toString(),
        tableName: r.tableName,
        recordId: r.recordId,
        action: r.action,
        oldValues: (r.oldValues as any) ?? null,
        newValues: (r.newValues as any) ?? null,
        performedBy: r.user
          ? { id: r.user.id, email: r.user.email, userType: r.user.userType }
          : null,
        ipAddress: r.ipAddress ?? null,
        requestId: r.requestId ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { total, page, limit },
    };
  }
}
