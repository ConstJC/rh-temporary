import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../generated/prisma/client';
import { createAuditTrail } from '../common/helpers/audit.helper';
import { RecordManualPaymentDto } from './dto/record-manual-payment.dto';
import { PaginationDto, PaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAllByPropertyGroup(
    pgId: string,
    pagination: PaginationDto,
    filters?: { status?: string; leaseId?: string; dateFrom?: string; dateTo?: string },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const where: any = { propertyGroupId: pgId, deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.leaseId) where.leaseId = filters.leaseId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.dueDate = {};
      if (filters.dateFrom) where.dueDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.dueDate.lte = new Date(filters.dateTo);
    }
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          lease: {
            include: {
              tenant: { select: { firstName: true, lastName: true } },
              unit: { select: { unitName: true } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    const meta: PaginationMeta = { page, limit, total };
    return { data: items, meta };
  }

  async findOne(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, deletedAt: null },
      include: {
        lease: {
          include: {
            tenant: { include: { user: { select: { id: true } } } },
            unit: { include: { property: true } },
          },
        },
        paymentTransactions: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    const pgId = payment.propertyGroupId;
    const isLandlord = await this.prisma.propertyGroupMember.findFirst({
      where: { propertyGroupId: pgId, userId, deletedAt: null },
    });
    const isTenant = payment.lease.tenant.userId === userId;
    if (!isLandlord && !isTenant) {
      throw new ForbiddenException('You do not have access to this payment');
    }
    const addonBills = await this.prisma.leaseAddonBill.findMany({
      where: {
        leaseId: payment.leaseId,
        periodStart: { lte: payment.periodEnd },
        periodEnd: { gte: payment.periodStart },
        deletedAt: null,
      },
      include: { unitAddon: { include: { addonCatalog: true } } },
    });
    return { ...payment, leaseAddonBills: addonBills };
  }

  async recordManualPayment(
    paymentId: string,
    userId: string,
    dto: RecordManualPaymentDto,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, deletedAt: null },
      include: {
        lease: {
          include: {
            tenant: { select: { userId: true } },
            unit: { select: { unitName: true } },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    const member = await this.prisma.propertyGroupMember.findFirst({
      where: { propertyGroupId: payment.propertyGroupId, userId, deletedAt: null },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this property group');
    }
    if (payment.status === 'PAID') {
      throw new UnprocessableEntityException('Cannot modify a fully paid payment');
    }
    const amountDue = Number(payment.amountDue);
    const currentPaid = Number(payment.amountPaid);
    const newPaid = currentPaid + dto.amountPaid;
    const status = newPaid >= amountDue ? 'PAID' : newPaid > 0 ? 'PARTIAL' : payment.status;
    const oldValues = { amountPaid: payment.amountPaid, status: payment.status };
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        amountPaid: newPaid,
        status,
        datePaid: dto.datePaid ? new Date(dto.datePaid) : undefined,
        paymentMethod: dto.paymentMethod,
        paymentDetails: (dto.paymentDetails ?? payment.paymentDetails) as any,
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'payments',
      recordId: paymentId,
      oldValues: oldValues as any,
      newValues: { amountPaid: updated.amountPaid, status: updated.status } as any,
    });
    if (payment.lease.tenant.userId) {
      await this.prisma.notification.create({
        data: {
          userId: payment.lease.tenant.userId,
          propertyGroupId: payment.propertyGroupId,
          type: 'PAYMENT_RECEIVED',
          channel: 'in_app',
          title: 'Payment received',
          body: `Your payment of ${dto.amountPaid} for ${payment.lease.unit.unitName} has been recorded.`,
        },
      });
    }
    return updated;
  }

  async generateMonthlyBills(): Promise<void> {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const leases = await this.prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        billingDay: dayOfMonth,
      },
      include: {
        tenant: { select: { userId: true, propertyGroupId: true } },
        unit: { select: { unitName: true } },
      },
    });
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const dueDate = new Date(today.getFullYear(), today.getMonth(), Math.min(dayOfMonth, lastOfMonth.getDate()));

    for (const lease of leases) {
      const existing = await this.prisma.payment.findFirst({
        where: { leaseId: lease.id, periodStart: firstOfMonth, deletedAt: null },
      });
      if (existing) continue;

      await this.prisma.payment.create({
        data: {
          leaseId: lease.id,
          propertyGroupId: lease.tenant.propertyGroupId,
          periodStart: firstOfMonth,
          periodEnd: lastOfMonth,
          dueDate,
          amountDue: lease.rentAmount,
          status: 'UNPAID',
        },
      });
      if (lease.tenant.userId) {
        await this.prisma.notification.create({
          data: {
            userId: lease.tenant.userId,
            propertyGroupId: lease.tenant.propertyGroupId,
            type: 'PAYMENT_REMINDER',
            channel: 'in_app',
            title: `Rent due on ${dueDate.toISOString().slice(0, 10)}`,
            body: `Your rent for ${lease.unit.unitName} is due.`,
          },
        });
      }
    }
  }

  async markOverduePayments(): Promise<void> {
    const leases = await this.prisma.lease.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, gracePeriodDays: true },
    });
    for (const lease of leases) {
      const overdue = await this.prisma.payment.findMany({
        where: {
          leaseId: lease.id,
          deletedAt: null,
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: {
            lt: new Date(Date.now() - lease.gracePeriodDays * 24 * 60 * 60 * 1000),
          },
        },
      });
      for (const p of overdue) {
        await this.prisma.payment.update({
          where: { id: p.id },
          data: { status: 'OVERDUE' },
        });
        const leaseWithTenant = await this.prisma.lease.findUnique({
          where: { id: lease.id },
          include: {
            tenant: { select: { userId: true, propertyGroupId: true } },
            unit: { select: { unitName: true } },
          },
        });
        if (leaseWithTenant?.tenant.userId) {
          await this.prisma.notification.create({
            data: {
              userId: leaseWithTenant.tenant.userId,
              propertyGroupId: leaseWithTenant.tenant.propertyGroupId,
              type: 'OVERDUE_ALERT',
              channel: 'in_app',
              title: 'Payment overdue',
              body: `Your payment for ${leaseWithTenant.unit.unitName} is overdue.`,
            },
          });
        }
      }
    }
  }
}
