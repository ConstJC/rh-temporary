import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { UserTypes } from '../auth/decorators/user-type.decorator';
import { UserType } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgMemberGuard } from '../property-groups/guards/org-member.guard';
import { PlanAccessGuard } from '../access-control/plan-access.guard';
import { RequireMenu } from '../access-control/decorators/require-menu.decorator';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { MENU_CODES } from '../access-control/constants/menu-codes';
import { PERMISSION_CODES } from '../access-control/constants/permission-codes';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';

@ApiTags('Tenants')
@Controller('property-groups/:pgId/tenants')
@UseGuards(JwtAuthGuard, UserTypeGuard, OrgMemberGuard, PlanAccessGuard)
@UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
@ApiBearerAuth('JWT-auth')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @RequireMenu(MENU_CODES.LANDLORD_TENANTS)
  @RequirePermission(PERMISSION_CODES.TENANT_CREATE)
  @ApiOperation({ summary: 'Create a tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created' })
  @ApiResponse({ status: 402, description: 'Plan limit exceeded' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('pgId') pgId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantsService.create(pgId, user.sub, dto);
  }

  @Get()
  @RequireMenu(MENU_CODES.LANDLORD_TENANTS)
  @RequirePermission(PERMISSION_CODES.TENANT_VIEW)
  @ApiOperation({ summary: 'List tenants' })
  @ApiResponse({ status: 200, description: 'Paginated list with active lease' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Param('pgId') pgId: string,
    @Query() query: ListTenantsQueryDto,
  ) {
    const { page, limit, status } = query;
    return this.tenantsService.findAll(pgId, { page, limit }, status);
  }

  @Get(':id')
  @RequireMenu(MENU_CODES.LANDLORD_TENANTS)
  @RequirePermission(PERMISSION_CODES.TENANT_VIEW)
  @ApiOperation({ summary: 'Get tenant detail with payment summary' })
  @ApiResponse({
    status: 200,
    description: 'Tenant with leases and payment summary',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('pgId') pgId: string, @Param('id') id: string) {
    return this.tenantsService.findOne(pgId, id);
  }

  @Patch(':id')
  @RequireMenu(MENU_CODES.LANDLORD_TENANTS)
  @RequirePermission(PERMISSION_CODES.TENANT_UPDATE)
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('pgId') pgId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(pgId, id, user.sub, dto);
  }

  @Delete(':id')
  @RequireMenu(MENU_CODES.LANDLORD_TENANTS)
  @RequirePermission(PERMISSION_CODES.TENANT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a tenant' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Has ACTIVE lease' })
  async remove(
    @Param('pgId') pgId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.tenantsService.remove(pgId, id, user.sub);
  }
}
