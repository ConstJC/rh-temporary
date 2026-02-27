import { AuditAction } from '../../generated/prisma/client';
import type { PrismaClient } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

export interface AuditTrailParams {
  userId: string | null;
  action: AuditAction;
  tableName: string;
  recordId: string;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  requestId?: string | null;
  sessionId?: string | null;
}

export async function createAuditTrail(
  prisma: PrismaClient,
  params: AuditTrailParams,
): Promise<void> {
  await prisma.auditTrail.create({
    data: {
      userId: params.userId,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId,
      oldValues: params.oldValues ?? undefined,
      newValues: params.newValues ?? undefined,
      ipAddress: params.ipAddress ?? undefined,
      requestId: params.requestId ?? undefined,
      sessionId: params.sessionId ?? undefined,
    },
  });
}
