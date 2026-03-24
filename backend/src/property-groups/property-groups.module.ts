import { Module } from '@nestjs/common';
import { PropertyGroupsController } from './property-groups.controller';
import { PropertyGroupsService } from './property-groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [MailModule, AccessControlModule],
  controllers: [PropertyGroupsController],
  providers: [PropertyGroupsService, PrismaService],
  exports: [PropertyGroupsService],
})
export class PropertyGroupsModule {}
