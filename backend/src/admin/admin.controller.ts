import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, UserType } from '../generated/prisma/client';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { UserTypes } from '../auth/decorators/user-type.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AdminService } from './admin.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdatePropertyGroupDto } from './dto/admin-update-property-group.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { UpdateSubscriptionPlanStatusDto } from './dto/update-subscription-plan-status.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, UserTypeGuard)
@Roles(UserRole.ADMIN)
@UserTypes(UserType.SYSTEM_ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('userType') userType?: UserType,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.adminService.getUsers({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      userType,
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      search,
      sort,
      order,
    });
  }

  @Patch('users/:id')
  async updateUser(
    @GetUser('id') currentUserId: string,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(currentUserId, id, dto);
  }

  @Get('property-groups')
  async getPropertyGroups(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: 'ACTIVE' | 'SUSPENDED',
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.adminService.getPropertyGroups({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      status,
      sort,
      order,
    });
  }

  @Patch('property-groups/:id')
  async updatePropertyGroup(
    @Param('id') id: string,
    @Body() dto: AdminUpdatePropertyGroupDto,
  ) {
    return this.adminService.updatePropertyGroup(id, dto);
  }

  @Get('property-groups/:id/details')
  async getPropertyGroupDetails(@Param('id') id: string) {
    return this.adminService.getPropertyGroupDetails(id);
  }

  @Get('subscriptions')
  async getSubscriptions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED',
    @Query('plan') plan?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.adminService.getSubscriptions({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      plan,
      sort,
      order,
    });
  }

  @Post('subscription-plans')
  async createSubscriptionPlan(
    @GetUser('id') currentUserId: string,
    @Body() dto: CreateSubscriptionPlanDto,
  ) {
    return this.adminService.createSubscriptionPlan(currentUserId, dto);
  }

  @Get('subscription-plans')
  async getSubscriptionPlans(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.adminService.getSubscriptionPlans({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      includeInactive: includeInactive === 'true',
      sort,
      order,
    });
  }

  @Patch('subscription-plans/:id')
  async updateSubscriptionPlan(
    @GetUser('id') currentUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.adminService.updateSubscriptionPlan(currentUserId, id, dto);
  }

  @Patch('subscription-plans/:id/status')
  async updateSubscriptionPlanStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanStatusDto,
  ) {
    return this.adminService.updateSubscriptionPlanStatus(id, dto.status);
  }

  @Get('access/menus')
  async getAccessMenus() {
    return this.adminService.getAccessMenus();
  }

  @Get('access/permissions')
  async getAccessPermissions() {
    return this.adminService.getAccessPermissions();
  }

  @Get('audit')
  async getAudit(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('tableName') tableName?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: 'INSERT' | 'UPDATE' | 'DELETE',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getAudit({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      tableName,
      userId,
      action,
      dateFrom,
      dateTo,
    });
  }
}
