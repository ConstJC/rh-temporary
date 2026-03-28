import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuditAction,
  UserRole,
  UserType,
  SubscriptionStatus,
} from '../generated/prisma/client';
import { createAuditTrail } from '../common/helpers/audit.helper';
import * as bcrypt from 'bcrypt';

type Order = 'asc' | 'desc';

function formatPgCode(pgNumber: number) {
  return `PG-${String(pgNumber).padStart(3, '0')}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async createPropertyGroupForOwnerTx(
    tx: any,
    params: {
      actorUserId: string | null;
      ownerUserId: string;
      groupName: string;
      currencyCode?: string;
      timezone?: string;
    },
  ) {
    const ownerRole = await tx.orgRole.findFirst({
      where: { code: 'OWNER', deletedAt: null },
      select: { id: true },
    });
    if (!ownerRole) {
      throw new BadRequestException('OWNER org role not found. Run seed.');
    }

    const freePlan = await tx.subscriptionPlan.findFirst({
      where: { planName: 'Free', deletedAt: null },
      select: { id: true },
    });
    if (!freePlan) {
      throw new BadRequestException(
        'Default Free subscription plan not found. Run seed.',
      );
    }

    const groupName = params.groupName.trim();
    if (!groupName) {
      throw new BadRequestException('Property group name is required');
    }

    const currencyCode = (params.currencyCode ?? 'PHP').trim().toUpperCase();
    const timezone = (params.timezone ?? 'Asia/Manila').trim();

    const existingActiveGroup = await tx.propertyGroup.findFirst({
      where: {
        createdBy: params.ownerUserId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existingActiveGroup) {
      throw new BadRequestException(
        'Selected landlord owner already has an active property group',
      );
    }

    const group = await tx.propertyGroup.create({
      data: {
        groupName,
        currencyCode,
        timezone,
        createdBy: params.ownerUserId,
      },
      select: {
        id: true,
        pgNumber: true,
        groupName: true,
        currencyCode: true,
        timezone: true,
      },
    });

    await tx.propertyGroupMember.create({
      data: {
        propertyGroupId: group.id,
        userId: params.ownerUserId,
        roleId: ownerRole.id,
      },
    });

    await tx.subscription.create({
      data: {
        propertyGroupId: group.id,
        subscriptionPlanId: freePlan.id,
        startedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    await createAuditTrail(tx as any, {
      userId: params.actorUserId,
      action: AuditAction.INSERT,
      tableName: 'property_groups',
      recordId: group.id,
      newValues: {
        groupName: group.groupName,
        currencyCode: group.currencyCode,
        timezone: group.timezone,
        createdBy: params.ownerUserId,
      } as any,
    });

    return group;
  }

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
        unitLimitPerProperty: number;
        propertyLimit: number;
        tenantLimit: number;
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
            maxUnitsPerProperty:
              subscription.subscriptionPlan.unitLimitPerProperty,
            maxProperties: subscription.subscriptionPlan.propertyLimit,
            maxTenants: subscription.subscriptionPlan.tenantLimit,
          }
        : {
            planName: 'UNKNOWN',
            status: 'EXPIRED',
            expiresAt: null,
            maxUnits: 0,
            maxUnitsPerProperty: 0,
            maxProperties: 0,
            maxTenants: 0,
          },
      _count: {
        properties: group.properties.length,
        units,
        members: group.members.length,
      },
    };
  }

  private async resolveCatalogCodes(data: {
    menuCodes?: string[];
    permissionCodes?: string[];
  }) {
    const menuCodes = data.menuCodes ?? [];
    const permissionCodes = data.permissionCodes ?? [];

    const [menus, permissions] = await Promise.all([
      this.prisma.featureMenu.findMany({
        where: {
          code: { in: menuCodes },
          deletedAt: null,
        },
        select: { id: true, code: true },
      }),
      this.prisma.featurePermission.findMany({
        where: {
          code: { in: permissionCodes },
          deletedAt: null,
        },
        select: { id: true, code: true },
      }),
    ]);

    const missingMenus = menuCodes.filter(
      (code) => !menus.some((menu) => menu.code === code),
    );
    if (missingMenus.length > 0) {
      throw new BadRequestException(
        `Unknown menu codes: ${missingMenus.join(', ')}`,
      );
    }

    const missingPermissions = permissionCodes.filter(
      (code) => !permissions.some((permission) => permission.code === code),
    );
    if (missingPermissions.length > 0) {
      throw new BadRequestException(
        `Unknown permission codes: ${missingPermissions.join(', ')}`,
      );
    }

    return { menus, permissions };
  }

  private async listPlanEntitlements(planId: string) {
    const [menus, permissions] = await Promise.all([
      this.prisma.subscriptionPlanMenu.findMany({
        where: {
          subscriptionPlanId: planId,
          deletedAt: null,
          isEnabled: true,
          menu: { deletedAt: null },
        },
        orderBy: [{ menu: { sortOrder: 'asc' } }, { menu: { label: 'asc' } }],
        select: { menu: { select: { code: true } } },
      }),
      this.prisma.subscriptionPlanPermission.findMany({
        where: {
          subscriptionPlanId: planId,
          deletedAt: null,
          isEnabled: true,
          permission: { deletedAt: null },
        },
        orderBy: [
          { permission: { moduleCode: 'asc' } },
          { permission: { action: 'asc' } },
        ],
        select: { permission: { select: { code: true } } },
      }),
    ]);

    return {
      menuCodes: menus.map((row) => row.menu.code),
      permissionCodes: permissions.map((row) => row.permission.code),
    };
  }

  private mapPlanWithAccess(
    plan: {
      id: string;
      planName: string;
      priceMonthly: number | { toString: () => string };
      propertyLimit: number;
      unitLimit: number;
      unitLimitPerProperty: number;
      tenantLimit: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    },
    access: { menuCodes: string[]; permissionCodes: string[] },
  ) {
    return {
      id: plan.id,
      name: plan.planName,
      priceMonthly: Number(plan.priceMonthly),
      maxUnits: plan.unitLimit,
      maxUnitsPerProperty: plan.unitLimitPerProperty,
      maxProperties: plan.propertyLimit,
      maxTenants: plan.tenantLimit,
      menuCodes: access.menuCodes,
      permissionCodes: access.permissionCodes,
      status: plan.deletedAt ? 'SUSPENDED' : 'ACTIVE',
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
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

  async createUser(
    currentUserId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role?: UserRole;
      userType: UserType;
      isActive?: boolean;
      phone?: string;
      propertyGroup?: {
        groupName: string;
        currencyCode?: string;
        timezone?: string;
      };
    },
  ) {
    const email = normalizeEmail(data.email);
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const phone = data.phone?.trim() || null;
    const shouldCreatePropertyGroup = data.userType === UserType.LANDLORD;

    if (shouldCreatePropertyGroup && !data.propertyGroup?.groupName?.trim()) {
      throw new BadRequestException(
        'Property group is required when userType is LANDLORD',
      );
    }
    if (!shouldCreatePropertyGroup && data.propertyGroup) {
      throw new BadRequestException(
        'Property group can only be provided for LANDLORD userType',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          firstName,
          lastName,
          role:
            data.role ??
            (data.userType === UserType.SYSTEM_ADMIN
              ? UserRole.ADMIN
              : UserRole.USER),
          userType: data.userType,
          phone,
          isActive: data.isActive ?? true,
          isEmailVerified: true,
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

      await createAuditTrail(tx as any, {
        userId: currentUserId,
        action: AuditAction.INSERT,
        tableName: 'users',
        recordId: user.id,
        newValues: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          userType: user.userType,
          isActive: user.isActive,
        } as any,
      });

      let propertyGroupId: string | null = null;
      if (shouldCreatePropertyGroup) {
        const group = await this.createPropertyGroupForOwnerTx(tx, {
          actorUserId: currentUserId,
          ownerUserId: user.id,
          groupName: data.propertyGroup!.groupName,
          currencyCode: data.propertyGroup?.currencyCode,
          timezone: data.propertyGroup?.timezone,
        });
        propertyGroupId = group.id;
      }

      return { user, propertyGroupId };
    });

    return {
      id: created.user.id,
      email: created.user.email,
      firstName: created.user.firstName,
      lastName: created.user.lastName,
      role: created.user.role,
      userType: created.user.userType,
      isActive: created.user.isActive,
      isEmailVerified: created.user.isEmailVerified,
      phone: created.user.phone,
      createdAt: created.user.createdAt.toISOString(),
      lastLoginAt: null,
      _count: { propertyGroups: created.propertyGroupId ? 1 : 0 },
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

  async createPropertyGroup(
    currentUserId: string,
    data: {
      groupName: string;
      currencyCode?: string;
      timezone?: string;
      ownerUserId: string;
    },
  ) {
    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerUserId },
      select: {
        id: true,
        userType: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!owner || owner.deletedAt) {
      throw new NotFoundException('Landlord owner not found');
    }
    if (owner.userType !== UserType.LANDLORD) {
      throw new BadRequestException(
        'Selected owner must be a LANDLORD account',
      );
    }
    if (!owner.isActive) {
      throw new BadRequestException(
        'Selected landlord owner account is inactive',
      );
    }

    const group = await this.prisma.$transaction(async (tx) => {
      return this.createPropertyGroupForOwnerTx(tx, {
        actorUserId: currentUserId,
        ownerUserId: owner.id,
        groupName: data.groupName,
        currencyCode: data.currencyCode,
        timezone: data.timezone,
      });
    });

    const createdGroup = await this.prisma.propertyGroup.findUnique({
      where: { id: group.id },
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
            endsAt: true,
            subscriptionPlan: {
              select: {
                planName: true,
                unitLimit: true,
                unitLimitPerProperty: true,
                propertyLimit: true,
                tenantLimit: true,
              },
            },
          },
        },
      },
    });

    if (!createdGroup) {
      throw new NotFoundException('Property group not found after creation');
    }

    return this.mapPropertyGroupSummary(createdGroup);
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
                  unitLimitPerProperty: true,
                  propertyLimit: true,
                  tenantLimit: true,
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
                unitLimitPerProperty: true,
                propertyLimit: true,
                tenantLimit: true,
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
              unitLimitPerProperty: true,
              propertyLimit: true,
              tenantLimit: true,
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
          maxUnitsPerProperty: s.subscriptionPlan.unitLimitPerProperty,
          maxProperties: s.subscriptionPlan.propertyLimit,
          maxTenants: s.subscriptionPlan.tenantLimit,
        },
      })),
      meta: { total, page, limit },
    };
  }

  async createSubscriptionPlan(
    userId: string | null,
    data: {
      name: string;
      priceMonthly: number;
      maxUnits: number;
      maxUnitsPerProperty: number;
      maxProperties: number;
      maxTenants: number;
      menuCodes: string[];
      permissionCodes: string[];
    },
  ) {
    const existing = await this.prisma.subscriptionPlan.findFirst({
      where: { planName: data.name.trim() },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Subscription plan name already exists');
    }

    const { menus, permissions } = await this.resolveCatalogCodes(data);

    const created = await this.prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.create({
        data: {
          planName: data.name.trim(),
          priceMonthly: data.priceMonthly,
          unitLimit: data.maxUnits,
          unitLimitPerProperty: data.maxUnitsPerProperty,
          propertyLimit: data.maxProperties,
          tenantLimit: data.maxTenants,
          accessPolicyVersion: 1,
        },
        select: {
          id: true,
          planName: true,
          priceMonthly: true,
          propertyLimit: true,
          unitLimit: true,
          unitLimitPerProperty: true,
          tenantLimit: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      if (menus.length > 0) {
        await tx.subscriptionPlanMenu.createMany({
          data: menus.map((menu) => ({
            subscriptionPlanId: plan.id,
            menuId: menu.id,
            isEnabled: true,
          })),
        });
      }
      if (permissions.length > 0) {
        await tx.subscriptionPlanPermission.createMany({
          data: permissions.map((permission) => ({
            subscriptionPlanId: plan.id,
            permissionId: permission.id,
            isEnabled: true,
          })),
        });
      }

      await createAuditTrail(tx as any, {
        userId,
        action: AuditAction.INSERT,
        tableName: 'subscription_plans',
        recordId: plan.id,
        newValues: {
          name: data.name.trim(),
          priceMonthly: data.priceMonthly,
          maxUnits: data.maxUnits,
          maxUnitsPerProperty: data.maxUnitsPerProperty,
          maxProperties: data.maxProperties,
          maxTenants: data.maxTenants,
          menuCodes: data.menuCodes,
          permissionCodes: data.permissionCodes,
        } as any,
      });

      return plan;
    });

    const access = await this.listPlanEntitlements(created.id);
    return this.mapPlanWithAccess(created, access);
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
          unitLimitPerProperty: true,
          tenantLimit: true,
          planMenus: {
            where: {
              deletedAt: null,
              isEnabled: true,
              menu: { deletedAt: null },
            },
            orderBy: [{ menu: { sortOrder: 'asc' } }, { menu: { label: 'asc' } }],
            select: { menu: { select: { code: true } } },
          },
          planPermissions: {
            where: {
              deletedAt: null,
              isEnabled: true,
              permission: { deletedAt: null },
            },
            orderBy: [
              { permission: { moduleCode: 'asc' } },
              { permission: { action: 'asc' } },
            ],
            select: { permission: { select: { code: true } } },
          },
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
        maxUnitsPerProperty: plan.unitLimitPerProperty,
        maxProperties: plan.propertyLimit,
        maxTenants: plan.tenantLimit,
        menuCodes: plan.planMenus.map((row) => row.menu.code),
        permissionCodes: plan.planPermissions.map((row) => row.permission.code),
        status: plan.deletedAt ? 'SUSPENDED' : 'ACTIVE',
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      })),
      meta: { total, page, limit },
    };
  }

  async updateSubscriptionPlan(
    userId: string | null,
    id: string,
    data: {
      name?: string;
      priceMonthly?: number;
      maxUnits?: number;
      maxUnitsPerProperty?: number;
      maxProperties?: number;
      maxTenants?: number;
      menuCodes?: string[];
      permissionCodes?: string[];
    },
  ) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      select: {
        id: true,
        planName: true,
        priceMonthly: true,
        propertyLimit: true,
        unitLimit: true,
        unitLimitPerProperty: true,
        tenantLimit: true,
        accessPolicyVersion: true,
      },
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

    const shouldUpdateMenus = Array.isArray(data.menuCodes);
    const shouldUpdatePermissions = Array.isArray(data.permissionCodes);
    const shouldBumpPolicyVersion = shouldUpdateMenus || shouldUpdatePermissions;

    const oldAccess = await this.listPlanEntitlements(id);

    const { menus, permissions } = await this.resolveCatalogCodes({
      menuCodes: data.menuCodes,
      permissionCodes: data.permissionCodes,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      if (shouldUpdateMenus) {
        await tx.subscriptionPlanMenu.deleteMany({
          where: { subscriptionPlanId: id },
        });
        if (menus.length > 0) {
          await tx.subscriptionPlanMenu.createMany({
            data: menus.map((menu) => ({
              subscriptionPlanId: id,
              menuId: menu.id,
              isEnabled: true,
            })),
          });
        }
      }

      if (shouldUpdatePermissions) {
        await tx.subscriptionPlanPermission.deleteMany({
          where: { subscriptionPlanId: id },
        });
        if (permissions.length > 0) {
          await tx.subscriptionPlanPermission.createMany({
            data: permissions.map((permission) => ({
              subscriptionPlanId: id,
              permissionId: permission.id,
              isEnabled: true,
            })),
          });
        }
      }

      const plan = await tx.subscriptionPlan.update({
        where: { id },
        data: {
          ...(data.name ? { planName: data.name.trim() } : {}),
          ...(typeof data.priceMonthly === 'number'
            ? { priceMonthly: data.priceMonthly }
            : {}),
          ...(typeof data.maxUnits === 'number'
            ? { unitLimit: data.maxUnits }
            : {}),
          ...(typeof data.maxUnitsPerProperty === 'number'
            ? { unitLimitPerProperty: data.maxUnitsPerProperty }
            : {}),
          ...(typeof data.maxProperties === 'number'
            ? { propertyLimit: data.maxProperties }
            : {}),
          ...(typeof data.maxTenants === 'number'
            ? { tenantLimit: data.maxTenants }
            : {}),
          ...(shouldBumpPolicyVersion
            ? { accessPolicyVersion: { increment: 1 } }
            : {}),
        },
        select: {
          id: true,
          planName: true,
          priceMonthly: true,
          propertyLimit: true,
          unitLimit: true,
          unitLimitPerProperty: true,
          tenantLimit: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      const nextMenuCodes = shouldUpdateMenus
        ? [...(data.menuCodes ?? [])]
        : oldAccess.menuCodes;
      const nextPermissionCodes = shouldUpdatePermissions
        ? [...(data.permissionCodes ?? [])]
        : oldAccess.permissionCodes;

      await createAuditTrail(tx as any, {
        userId,
        action: AuditAction.UPDATE,
        tableName: 'subscription_plans',
        recordId: id,
        oldValues: {
          name: existing.planName,
          priceMonthly: Number(existing.priceMonthly),
          maxUnits: existing.unitLimit,
          maxUnitsPerProperty: existing.unitLimitPerProperty,
          maxProperties: existing.propertyLimit,
          maxTenants: existing.tenantLimit,
          menuCodes: oldAccess.menuCodes,
          permissionCodes: oldAccess.permissionCodes,
          accessPolicyVersion: existing.accessPolicyVersion,
        } as any,
        newValues: {
          name: plan.planName,
          priceMonthly: Number(plan.priceMonthly),
          maxUnits: plan.unitLimit,
          maxUnitsPerProperty: plan.unitLimitPerProperty,
          maxProperties: plan.propertyLimit,
          maxTenants: plan.tenantLimit,
          menuCodes: nextMenuCodes,
          permissionCodes: nextPermissionCodes,
          accessPolicyVersion:
            shouldBumpPolicyVersion
              ? existing.accessPolicyVersion + 1
              : existing.accessPolicyVersion,
        } as any,
      });

      return plan;
    });

    const access = await this.listPlanEntitlements(id);
    return this.mapPlanWithAccess(updated, access);
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

  async getAccessMenus() {
    const rows = await this.prisma.featureMenu.findMany({
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

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
      routePattern: row.routePattern,
      sortOrder: row.sortOrder,
    }));
  }

  async getAccessPermissions() {
    const rows = await this.prisma.featurePermission.findMany({
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

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      moduleCode: row.moduleCode,
      action: row.action,
      description: row.description,
    }));
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
