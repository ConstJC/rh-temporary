import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlService } from './access-control.service';
import { PlanAccessGuard } from './plan-access.guard';

@Module({
  providers: [PrismaService, AccessControlService, PlanAccessGuard],
  exports: [AccessControlService, PlanAccessGuard],
})
export class AccessControlModule {}
