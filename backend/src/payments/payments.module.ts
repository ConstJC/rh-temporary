import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsCron } from './payments.cron';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [AccessControlModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsCron, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
