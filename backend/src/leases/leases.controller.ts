import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { UserTypes } from '../auth/decorators/user-type.decorator';
import { UserType } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgMemberGuard } from '../property-groups/guards/org-member.guard';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { CloseLeaseDto } from './dto/close-lease.dto';
import { ListLeasesQueryDto } from './dto/list-leases-query.dto';

@ApiTags('Leases')
@Controller()
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post('property-groups/:pgId/leases')
  @UseGuards(UserTypeGuard, OrgMemberGuard)
  @UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a lease (activates unit, creates advance + deposit payments)' })
  @ApiResponse({ status: 201, description: 'Lease created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Unit not available or already has ACTIVE lease' })
  async create(
    @Param('pgId') pgId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeaseDto,
  ) {
    return this.leasesService.create(pgId, user.sub, dto);
  }

  @Get('property-groups/:pgId/leases')
  @UseGuards(UserTypeGuard, OrgMemberGuard)
  @UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List leases for property group' })
  @ApiResponse({ status: 200, description: 'Paginated list with payment summary' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllByPropertyGroup(
    @Param('pgId') pgId: string,
    @Query() query: ListLeasesQueryDto,
  ) {
    const { page, limit, status, unitId, tenantId } = query;
    return this.leasesService.findAllByPropertyGroup(
      pgId,
      { page, limit },
      { status, unitId, tenantId },
    );
  }

  @Get('leases/:leaseId')
  @ApiOperation({ summary: 'Get lease detail (landlord or tenant who owns it)' })
  @ApiResponse({ status: 200, description: 'Lease with tenant, unit, property, payments' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Param('leaseId') leaseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leasesService.findOne(leaseId, user.sub, user.userType);
  }

  @Patch('leases/:leaseId')
  @UseGuards(UserTypeGuard)
  @UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update lease (landlord)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('leaseId') leaseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLeaseDto,
  ) {
    return this.leasesService.update(leaseId, user.sub, dto);
  }

  @Post('leases/:leaseId/close')
  @UseGuards(UserTypeGuard)
  @UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Close lease (unit AVAILABLE, tenant MOVED_OUT, future payments CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Lease closed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Lease not ACTIVE' })
  async close(
    @Param('leaseId') leaseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CloseLeaseDto,
  ) {
    return this.leasesService.close(leaseId, user.sub, dto);
  }
}
