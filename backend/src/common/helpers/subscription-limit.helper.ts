import { HttpException, HttpStatus } from '@nestjs/common';
import type { PrismaClient } from '../../generated/prisma/client';

export async function checkSubscriptionLimit(
  prisma: PrismaClient,
  propertyGroupId: string,
  type: 'property' | 'unit' | 'tenant',
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
    tenantLimit: number;
  };
  const limit =
    type === 'property'
      ? plan.propertyLimit
      : type === 'unit'
        ? plan.unitLimit
        : plan.tenantLimit;
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
  } else {
    count = await prisma.tenant.count({
      where: { propertyGroupId, deletedAt: null },
    });
  }
  if (count >= limit) {
    throw new HttpException(
      {
        error: {
          code: 'PLAN_LIMIT_EXCEEDED',
          message: `${type} limit reached`,
        },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
