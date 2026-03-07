import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../generated/prisma/client';
import { createAuditTrail } from '../common/helpers/audit.helper';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class PropertyGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePropertyGroupDto) {
    const ownerRole = await this.prisma.orgRole.findFirst({
      where: { code: 'OWNER', deletedAt: null },
    });
    if (!ownerRole) {
      throw new Error('OWNER org role not found. Run seed.');
    }
    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: { planName: 'Free', deletedAt: null },
    });
    if (!freePlan) {
      throw new Error('Free subscription plan not found. Run seed.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const group = await tx.propertyGroup.create({
        data: {
          groupName: dto.groupName,
          currencyCode: dto.currencyCode ?? 'PHP',
          timezone: dto.timezone ?? 'Asia/Manila',
          createdBy: userId,
        },
      });
      await tx.propertyGroupMember.create({
        data: {
          propertyGroupId: group.id,
          userId,
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
        userId,
        action: AuditAction.INSERT,
        tableName: 'property_groups',
        recordId: group.id,
        newValues: {
          groupName: group.groupName,
          currencyCode: group.currencyCode,
          timezone: group.timezone,
        },
      });
      return group;
    });

    const withSubscription = await this.prisma.propertyGroup.findUnique({
      where: { id: result.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE', deletedAt: null },
          take: 1,
          include: { subscriptionPlan: true },
        },
      },
    });
    return withSubscription;
  }

  async findAll(userId: string) {
    const members = await this.prisma.propertyGroupMember.findMany({
      where: { userId, deletedAt: null },
      include: {
        propertyGroup: true,
        role: true,
      },
    });
    const groupIds = members.map((m) => m.propertyGroupId);
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        propertyGroupId: { in: groupIds },
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: { subscriptionPlan: true },
    });
    const subByPg = new Map(subscriptions.map((s) => [s.propertyGroupId, s]));
    return members.map((m) => ({
      id: m.propertyGroup.id,
      groupName: m.propertyGroup.groupName,
      currencyCode: m.propertyGroup.currencyCode,
      timezone: m.propertyGroup.timezone,
      subscription: subByPg.get(m.propertyGroupId)
        ? {
            status: subByPg.get(m.propertyGroupId)!.status,
            plan: {
              planName: subByPg.get(m.propertyGroupId)!.subscriptionPlan
                .planName,
              unitLimit: subByPg.get(m.propertyGroupId)!.subscriptionPlan
                .unitLimit,
            },
          }
        : null,
    }));
  }

  async update(id: string, userId: string, dto: UpdatePropertyGroupDto) {
    const group = await this.prisma.propertyGroup.findFirst({
      where: { id, deletedAt: null },
    });
    if (!group) {
      throw new NotFoundException('Property group not found');
    }
    const oldValues = { ...group };
    const updated = await this.prisma.propertyGroup.update({
      where: { id },
      data: {
        ...(dto.groupName != null && { groupName: dto.groupName }),
        ...(dto.timezone != null && { timezone: dto.timezone }),
        ...(dto.currencyCode != null && { currencyCode: dto.currencyCode }),
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'property_groups',
      recordId: id,
      oldValues: oldValues as any,
      newValues: updated as any,
    });
    return updated;
  }

  async findMembers(propertyGroupId: string) {
    const members = await this.prisma.propertyGroupMember.findMany({
      where: { propertyGroupId, deletedAt: null },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        role: { select: { code: true, name: true } },
      },
    });
    return members.map((m) => ({
      id: m.id,
      user: m.user,
      role: m.role,
    }));
  }

  async addMember(
    propertyGroupId: string,
    userId: string,
    dto: InviteMemberDto,
  ) {
    const orgRole = await this.prisma.orgRole.findFirst({
      where: { code: dto.roleCode, deletedAt: null },
    });
    if (!orgRole) {
      throw new BadRequestException('Invalid roleCode');
    }
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const existingMember = await this.prisma.propertyGroupMember.findFirst({
      where: {
        propertyGroupId,
        deletedAt: null,
        ...(existingUser ? { userId: existingUser.id } : {}),
      },
    });
    if (existingUser && existingMember) {
      throw new ConflictException('User is already a member');
    }
    if (existingUser) {
      const member = await this.prisma.propertyGroupMember.create({
        data: {
          propertyGroupId,
          userId: existingUser.id,
          roleId: orgRole.id,
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          role: { select: { code: true, name: true } },
        },
      });
      await createAuditTrail(this.prisma, {
        userId,
        action: AuditAction.INSERT,
        tableName: 'property_group_members',
        recordId: member.id,
        newValues: { email: dto.email, roleCode: dto.roleCode } as any,
      });
      return member;
    }
    // Phase 2: send invite email and store pending invite. For Phase 1 we just throw.
    throw new NotFoundException('User not found. Invite by email is Phase 2.');
  }

  async updateMemberRole(
    propertyGroupId: string,
    memberId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const member = await this.prisma.propertyGroupMember.findFirst({
      where: { id: memberId, propertyGroupId, deletedAt: null },
      include: { role: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.userId === userId) {
      throw new BadRequestException('Cannot change your own role');
    }
    const ownerCount = await this.prisma.propertyGroupMember.count({
      where: { propertyGroupId, deletedAt: null, role: { code: 'OWNER' } },
    });
    if (member.role.code === 'OWNER' && ownerCount <= 1) {
      throw new BadRequestException('Cannot demote the last OWNER');
    }
    const newRole = await this.prisma.orgRole.findFirst({
      where: { code: dto.roleCode, deletedAt: null },
    });
    if (!newRole) {
      throw new BadRequestException('Invalid roleCode');
    }
    const updated = await this.prisma.propertyGroupMember.update({
      where: { id: memberId },
      data: { roleId: newRole.id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        role: { select: { code: true, name: true } },
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'property_group_members',
      recordId: memberId,
      oldValues: { roleCode: member.role.code } as any,
      newValues: { roleCode: dto.roleCode } as any,
    });
    return updated;
  }

  async removeMember(
    propertyGroupId: string,
    memberId: string,
    userId: string,
  ) {
    const member = await this.prisma.propertyGroupMember.findFirst({
      where: { id: memberId, propertyGroupId, deletedAt: null },
      include: { role: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const ownerCount = await this.prisma.propertyGroupMember.count({
      where: { propertyGroupId, deletedAt: null, role: { code: 'OWNER' } },
    });
    if (member.role.code === 'OWNER' && ownerCount <= 1) {
      throw new BadRequestException('Cannot remove the last OWNER');
    }
    await this.prisma.propertyGroupMember.update({
      where: { id: memberId },
      data: { deletedAt: new Date() },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.DELETE,
      tableName: 'property_group_members',
      recordId: memberId,
      oldValues: { userId: member.userId, roleCode: member.role.code } as any,
    });
  }

  async getSubscription(propertyGroupId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { propertyGroupId, status: 'ACTIVE', deletedAt: null },
      include: { subscriptionPlan: true },
    });
    if (!sub) {
      throw new NotFoundException('No active subscription');
    }
    const [properties, units, tenants] = await Promise.all([
      this.prisma.property.count({
        where: { propertyGroupId, deletedAt: null },
      }),
      this.prisma.unit.count({
        where: { property: { propertyGroupId }, deletedAt: null },
      }),
      this.prisma.lease
        .findMany({
          where: {
            propertyGroupId,
            deletedAt: null,
            tenant: { deletedAt: null },
          },
          distinct: ['tenantId'],
          select: { tenantId: true },
        })
        .then((rows) => rows.length),
    ]);
    return {
      status: sub.status,
      plan: {
        planName: sub.subscriptionPlan.planName,
        propertyLimit: sub.subscriptionPlan.propertyLimit,
        unitLimit: sub.subscriptionPlan.unitLimit,
        tenantLimit: sub.subscriptionPlan.tenantLimit,
      },
      usage: { properties, units, tenants },
    };
  }

  async getOverviewStats(propertyGroupId: string) {
    const [totalProperties, allUnits, tenantRows, activeLeases, allPayments] =
      await Promise.all([
        this.prisma.property.count({
          where: { propertyGroupId, deletedAt: null },
        }),
        this.prisma.unit.findMany({
          where: { property: { propertyGroupId }, deletedAt: null },
          select: { status: true },
        }),
        this.prisma.lease.findMany({
          where: {
            propertyGroupId,
            deletedAt: null,
            tenant: { deletedAt: null },
          },
          distinct: ['tenantId'],
          select: { tenant: { select: { status: true } } },
        }),
        this.prisma.lease.count({
          where: {
            unit: { property: { propertyGroupId } },
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
        this.prisma.payment.findMany({
          where: {
            lease: { unit: { property: { propertyGroupId } } },
            deletedAt: null,
          },
          select: { status: true, amountDue: true, amountPaid: true },
        }),
      ]);

    const totalUnits = allUnits.length;
    const occupiedUnits = allUnits.filter(
      (u) => u.status === 'OCCUPIED',
    ).length;
    const availableUnits = allUnits.filter(
      (u) => u.status === 'AVAILABLE',
    ).length;

    const totalTenants = tenantRows.length;
    const activeTenants = tenantRows.filter(
      (t) => t.tenant.status === 'ACTIVE',
    ).length;

    const totalRevenue = allPayments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amountPaid), 0);

    const pendingPayments = allPayments.filter(
      (p) => p.status === 'UNPAID',
    ).length;

    const overduePayments = allPayments.filter(
      (p) => p.status === 'OVERDUE',
    ).length;

    const occupancyRate =
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      availableUnits,
      totalTenants,
      activeTenants,
      totalRevenue,
      pendingPayments,
      overduePayments,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }
}
