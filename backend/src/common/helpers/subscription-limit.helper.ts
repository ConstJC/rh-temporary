import { HttpException, HttpStatus } from '@nestjs/common';
import type { PrismaClient } from '../../generated/prisma/client';

export async function checkSubscriptionLimit(
  prisma: PrismaClient,
  propertyGroupId: string,
  type: 'property' | 'unit' | 'tenant' | 'unit_per_property',
  options?: { propertyId?: string },
): Promise<void> {
  const sub = await prisma.subscription.findFirst({
    where: { propertyGroupId, status: 'ACTIVE', deletedAt: null },
    include: { subscriptionPlan: true },
  });
  if (!sub) {
    throw new HttpException(
      { error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription' } },
      HttpStatus.BAD_REQUEST,
    );
  }
  const plan = sub.subscriptionPlan as {
    propertyLimit: number;
    unitLimit: number;
    unitLimitPerProperty: number;
    tenantLimit: number;
  };
  const limit =
    type === 'property'
      ? plan.propertyLimit
      : type === 'unit'
        ? plan.unitLimit
        : type === 'tenant'
          ? plan.tenantLimit
          : plan.unitLimitPerProperty;
  if (limit === 0) return; // unlimited

  let count: number;
  if (type === 'property') {
    count = await prisma.property.count({
      where: { propertyGroupId, deletedAt: null },
    });
  } else if (type === 'unit') {
    count = await prisma.unit.count({
      where: { property: { propertyGroupId }, deletedAt: null },
    });
  } else if (type === 'unit_per_property') {
    if (!options?.propertyId) {
      throw new HttpException(
        {
          error: {
            code: 'PLAN_LIMIT_CONFIG_ERROR',
            message:
              'propertyId is required for unit_per_property limit checks',
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    count = await prisma.unit.count({
      where: { propertyId: options.propertyId, deletedAt: null },
    });
  } else {
    count = (
      await prisma.lease.findMany({
        where: {
          propertyGroupId,
          deletedAt: null,
          tenant: { deletedAt: null },
        },
        distinct: ['tenantId'],
        select: { tenantId: true },
      })
    ).length;
  }
  if (count >= limit) {
    throw new HttpException(
      {
        error: {
          code: 'PLAN_LIMIT_EXCEEDED',
          message:
            type === 'unit_per_property'
              ? 'unit per property limit reached'
              : `${type} limit reached`,
        },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
