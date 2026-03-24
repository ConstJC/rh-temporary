import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../generated/prisma/client';
import { createAuditTrail } from '../common/helpers/audit.helper';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { CloseLeaseDto } from './dto/close-lease.dto';
import { PaginationDto, PaginationMeta } from '../common/dto/pagination.dto';

function lastDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function firstDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

@Injectable()
export class LeasesService {
  constructor(private prisma: PrismaService) {}

  async create(pgId: string, userId: string, dto: CreateLeaseDto) {
    const [unit, tenant] = await Promise.all([
      this.prisma.unit.findFirst({
        where: { id: dto.unitId, deletedAt: null },
        include: { property: true },
      }),
      this.prisma.tenant.findFirst({
        where: { id: dto.tenantId, deletedAt: null },
      }),
    ]);
    if (!unit || unit.property.propertyGroupId !== pgId) {
      throw new NotFoundException(
        'Unit not found or does not belong to this property group',
      );
    }
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    if (unit.status !== 'AVAILABLE') {
      throw new ConflictException(
        'Unit is not available (may be OCCUPIED or in MAINTENANCE)',
      );
    }
    const activeLease = await this.prisma.lease.findFirst({
      where: { unitId: dto.unitId, status: 'ACTIVE', deletedAt: null },
    });
    if (activeLease) {
      throw new ConflictException('Unit already has an ACTIVE lease');
    }
    const tenantActiveLease = await this.prisma.lease.findFirst({
      where: { tenantId: dto.tenantId, status: 'ACTIVE', deletedAt: null },
    });
    if (tenantActiveLease) {
      throw new ConflictException('Tenant already has an ACTIVE lease');
    }

    const moveInDate = new Date(dto.moveInDate);
    const billingDay = dto.billingDay ?? 1;
    const advanceMonths = dto.advanceMonths ?? 1;
    const gracePeriodDays = dto.gracePeriodDays ?? 3;
    const propertyGroupId = unit.property.propertyGroupId;
    const propertyId = unit.propertyId;

    const result = await this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          propertyGroupId,
          propertyId,
          tenantId: dto.tenantId,
          unitId: dto.unitId,
          leaseType: dto.leaseType,
          billingDay,
          advanceMonths,
          gracePeriodDays,
          moveInDate,
          rentAmount: dto.rentAmount,
          securityDeposit: dto.securityDeposit,
          status: 'ACTIVE',
        },
      });

      await tx.unit.update({
        where: { id: dto.unitId },
        data: { status: 'OCCUPIED' },
      });
      await tx.tenant.update({
        where: { id: dto.tenantId },
        data: { status: 'ACTIVE' },
      });

      for (let i = 0; i < advanceMonths; i++) {
        const periodStart =
          i === 0
            ? firstDayOfMonth(moveInDate)
            : firstDayOfMonth(addMonths(moveInDate, i));
        const periodEnd = lastDayOfMonth(periodStart);
        await tx.payment.create({
          data: {
            leaseId: lease.id,
            propertyGroupId,
            periodStart,
            periodEnd,
            dueDate: moveInDate,
            amountDue: dto.rentAmount,
            status: 'UNPAID',
          },
        });
      }

      await tx.payment.create({
        data: {
          leaseId: lease.id,
          propertyGroupId,
          periodStart: moveInDate,
          periodEnd: moveInDate,
          dueDate: moveInDate,
          amountDue: dto.securityDeposit,
          status: 'UNPAID',
          paymentDetails: { type: 'SECURITY_DEPOSIT' } as any,
        },
      });

      await createAuditTrail(tx as any, {
        userId,
        action: AuditAction.INSERT,
        tableName: 'leases',
        recordId: lease.id,
        newValues: lease as any,
      });

      return lease;
    });

    return this.prisma.lease.findUnique({
      where: { id: result.id },
      include: { tenant: true, unit: true },
    });
  }

  async findAllByPropertyGroup(
    pgId: string,
    pagination: PaginationDto,
    filters?: { status?: string; unitId?: string; tenantId?: string },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const where: any = {
      propertyGroupId: pgId,
      deletedAt: null,
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.unitId) where.unitId = filters.unitId;
    if (filters?.tenantId) where.tenantId = filters.tenantId;

    const [items, total] = await Promise.all([
      this.prisma.lease.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, firstName: true, lastName: true } },
          unit: {
            select: {
              id: true,
              unitName: true,
              floorNumber: true,
              property: {
                select: {
                  id: true,
                  propertyName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.lease.count({ where }),
    ]);

    const paymentSummaries = await Promise.all(
      items.map(async (l) => {
        const agg = await this.prisma.payment.aggregate({
          where: { leaseId: l.id, deletedAt: null },
          _sum: { amountDue: true, amountPaid: true },
        });
        const overdueCount = await this.prisma.payment.count({
          where: { leaseId: l.id, deletedAt: null, status: 'OVERDUE' },
        });
        return {
          totalDue: Number(agg._sum.amountDue ?? 0),
          totalPaid: Number(agg._sum.amountPaid ?? 0),
          overdueCount,
        };
      }),
    );

    const data = items.map((l, i) => ({
      ...l,
      paymentSummary: paymentSummaries[i],
    }));
    const meta: PaginationMeta = { page, limit, total };
    return { data, meta };
  }

  async findOne(leaseId: string, userId: string, userType: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { id: leaseId, deletedAt: null },
      include: {
        tenant: { include: { user: { select: { id: true } } } },
        unit: { include: { property: true } },
        payments: true,
      },
    });
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }
    const pgId = lease.propertyGroupId;
    const isLandlord = await this.prisma.propertyGroupMember.findFirst({
      where: { propertyGroupId: pgId, userId, deletedAt: null },
    });
    const isTenant = lease.tenant.userId === userId;
    if (!isLandlord && !isTenant) {
      throw new ForbiddenException('You do not have access to this lease');
    }
    return lease;
  }

  async update(leaseId: string, userId: string, dto: UpdateLeaseDto) {
    const lease = await this.prisma.lease.findFirst({
      where: { id: leaseId, deletedAt: null },
      include: { tenant: true },
    });
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }
    const member = await this.prisma.propertyGroupMember.findFirst({
      where: {
        propertyGroupId: lease.propertyGroupId,
        userId,
        deletedAt: null,
      },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this property group');
    }
    const oldValues = { ...lease };
    const updated = await this.prisma.lease.update({
      where: { id: leaseId },
      data: {
        ...(dto.moveOutDate != null && {
          moveOutDate: new Date(dto.moveOutDate),
        }),
        ...(dto.gracePeriodDays != null && {
          gracePeriodDays: dto.gracePeriodDays,
        }),
        ...(dto.rentAmount != null && { rentAmount: dto.rentAmount }),
      },
      include: { tenant: true, unit: true },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'leases',
      recordId: leaseId,
      oldValues: oldValues as any,
      newValues: updated as any,
    });
    return updated;
  }

  async close(leaseId: string, userId: string, dto: CloseLeaseDto) {
    const lease = await this.prisma.lease.findFirst({
      where: { id: leaseId, deletedAt: null },
      include: { tenant: true, unit: true },
    });
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }
    const member = await this.prisma.propertyGroupMember.findFirst({
      where: {
        propertyGroupId: lease.propertyGroupId,
        userId,
        deletedAt: null,
      },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this property group');
    }
    if (lease.status !== 'ACTIVE') {
      throw new ConflictException('Lease is not ACTIVE');
    }

    const moveOutDate = new Date(dto.moveOutDate);

    await this.prisma.$transaction(async (tx) => {
      await tx.lease.update({
        where: { id: leaseId },
        data: { status: 'CLOSED', moveOutDate },
      });
      await tx.unit.update({
        where: { id: lease.unitId },
        data: { status: 'AVAILABLE' },
      });
      await tx.tenant.update({
        where: { id: lease.tenantId },
        data: { status: 'MOVED_OUT' },
      });
      await tx.payment.updateMany({
        where: {
          leaseId,
          deletedAt: null,
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: { gt: moveOutDate },
        },
        data: { status: 'CANCELLED' },
      });
      await createAuditTrail(tx as any, {
        userId,
        action: AuditAction.UPDATE,
        tableName: 'leases',
        recordId: leaseId,
        newValues: { status: 'CLOSED', moveOutDate: dto.moveOutDate } as any,
      });
    });

    return this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: { tenant: true, unit: true },
    });
  }
}
