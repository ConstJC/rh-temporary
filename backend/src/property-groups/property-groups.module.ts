import { Module } from '@nestjs/common';
import { PropertyGroupsController } from './property-groups.controller';
import { PropertyGroupsService } from './property-groups.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PropertyGroupsController],
  providers: [PropertyGroupsService, PrismaService],
  exports: [PropertyGroupsService],
})
export class PropertyGroupsModule {}
