import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const where: any = {
      deletedAt: null,
      propertyGroupId: pgId,
      tenant: { deletedAt: null, ...(status ? { status } : {}) },
      unit: {
        deletedAt: null,
        property: { deletedAt: null },
      },
    };

    const leases = await this.prisma.lease.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        tenant: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            internalNotes: true,
            emergencyContact: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitName: true,
            property: {
              select: { id: true, propertyName: true },
            },
          },
        },
      },
    });

    const preferredLeaseByTenant = new Map<string, (typeof leases)[number]>();
    for (const lease of leases) {
      const existing = preferredLeaseByTenant.get(lease.tenantId);
      if (!existing) {
        preferredLeaseByTenant.set(lease.tenantId, lease);
        continue;
      }

      const currentIsActive = existing.status === 'ACTIVE';
      const nextIsActive = lease.status === 'ACTIVE';
      if (!currentIsActive && nextIsActive) {
        preferredLeaseByTenant.set(lease.tenantId, lease);
        continue;
      }

      const existingTs = existing.createdAt.getTime();
      const nextTs = lease.createdAt.getTime();
      if (nextTs > existingTs) {
        preferredLeaseByTenant.set(lease.tenantId, lease);
      }
    }

    const tenantLeaseRows = Array.from(preferredLeaseByTenant.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const total = tenantLeaseRows.length;
    const pageRows = tenantLeaseRows.slice(skip, skip + limit);

    const data = pageRows.map((lease) => ({
      id: lease.tenant.id,
      userId: lease.tenant.userId,
      firstName: lease.tenant.firstName,
      lastName: lease.tenant.lastName,
      phone: lease.tenant.phone,
      email: lease.tenant.email,
      internalNotes: lease.tenant.internalNotes,
      emergencyContact: lease.tenant.emergencyContact,
      status: lease.tenant.status,
      createdAt: lease.tenant.createdAt,
      updatedAt: lease.tenant.updatedAt,
      leases: [
        {
          id: lease.id,
          status: lease.status,
          unit: {
            id: lease.unit.id,
            unitName: lease.unit.unitName,
            property: lease.unit.property,
          },
        },
      ],
      activeLease:
        lease.status === 'ACTIVE'
          ? {
              id: lease.id,
              unit: {
                id: lease.unit.id,
                unitName: lease.unit.unitName,
                property: lease.unit.property,
              },
            }
          : undefined,
    }));
    const meta: PaginationMeta = { page, limit, total };
    return { data, meta };
  }

  async findOne(pgId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
        leases: { some: { propertyGroupId: pgId, deletedAt: null } },
      },
      include: {
        leases: {
          where: { propertyGroupId: pgId, deletedAt: null },
          include: {
            unit: {
              select: {
                unitName: true,
                floorNumber: true,
                property: { select: { id: true, propertyName: true } },
              },
            },
          },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const paymentSummary = await this.prisma.payment.aggregate({
      where: {
        lease: { tenantId, propertyGroupId: pgId, deletedAt: null },
        deletedAt: null,
      },
      _sum: { amountDue: true, amountPaid: true },
      _count: true,
    });
    const overdueCount = await this.prisma.payment.count({
      where: {
        lease: { tenantId, propertyGroupId: pgId, deletedAt: null },
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

  async update(
    pgId: string,
    tenantId: string,
    userId: string,
    dto: UpdateTenantDto,
  ) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
        leases: { some: { propertyGroupId: pgId, deletedAt: null } },
      },
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

  async remove(pgId: string, tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
        leases: { some: { propertyGroupId: pgId, deletedAt: null } },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const activeLease = await this.prisma.lease.findFirst({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (activeLease) {
      throw new ConflictException('Cannot delete tenant with ACTIVE lease');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { deletedAt: new Date() },
    });

    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.DELETE,
      tableName: 'tenants',
      recordId: tenantId,
      oldValues: tenant as any,
    });
  }
}
