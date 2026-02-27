import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../generated/prisma/client';
import { createAuditTrail } from '../common/helpers/audit.helper';
import { checkSubscriptionLimit } from '../common/helpers/subscription-limit.helper';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto, PaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(pgId: string, userId: string, dto: CreateTenantDto) {
    await checkSubscriptionLimit(this.prisma, pgId, 'tenant');
    const tenant = await this.prisma.tenant.create({
      data: {
        propertyGroupId: pgId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email ?? undefined,
        emergencyContact: (dto.emergencyContact ?? undefined) as any,
        status: 'ACTIVE',
        userId: null,
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.INSERT,
      tableName: 'tenants',
      recordId: tenant.id,
      newValues: tenant as any,
    });
    return tenant;
  }

  async findAll(pgId: string, pagination: PaginationDto, status?: string) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const where: any = { propertyGroupId: pgId, deletedAt: null };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          leases: {
            where: { status: 'ACTIVE', deletedAt: null },
            take: 1,
            include: { unit: { select: { unitName: true } } },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);
    const data = items.map((t) => {
      const { leases, ...rest } = t;
      return {
        ...rest,
        activeLease: leases?.[0]
          ? { unitName: leases[0].unit.unitName }
          : undefined,
      };
    });
    const meta: PaginationMeta = { page, limit, total };
    return { data, meta };
  }

  async findOne(pgId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, propertyGroupId: pgId, deletedAt: null },
      include: {
        leases: {
          where: { deletedAt: null },
          include: { unit: { select: { unitName: true, floorNumber: true } } },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const paymentSummary = await this.prisma.payment.aggregate({
      where: { lease: { tenantId }, deletedAt: null },
      _sum: { amountDue: true, amountPaid: true },
      _count: true,
    });
    const overdueCount = await this.prisma.payment.count({
      where: {
        lease: { tenantId },
        deletedAt: null,
        status: 'OVERDUE',
      },
    });
    const totalDue = Number(paymentSummary._sum.amountDue ?? 0);
    const totalPaid = Number(paymentSummary._sum.amountPaid ?? 0);
    return {
      ...tenant,
      paymentSummary: { totalDue, totalPaid, overdueCount },
    };
  }

  async update(pgId: string, tenantId: string, userId: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, propertyGroupId: pgId, deletedAt: null },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const oldValues = { ...tenant };
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.phone != null && { phone: dto.phone }),
        ...(dto.status != null && { status: dto.status }),
        ...(dto.internalNotes != null && { internalNotes: dto.internalNotes }),
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'tenants',
      recordId: tenantId,
      oldValues: oldValues as any,
      newValues: updated as any,
    });
    return updated;
  }
}
