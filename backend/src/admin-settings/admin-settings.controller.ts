import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { UserTypes } from '../auth/decorators/user-type.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole, UserType } from '../generated/prisma/client';
import { AdminSettingsService } from './admin-settings.service';
import { CreateAccessMenuDto } from './dto/create-access-menu.dto';
import { CreateAccessRoleDto } from './dto/create-access-role.dto';
import { ListAccessQueryDto } from './dto/list-access-query.dto';
import { UpdateAccessMenuDto } from './dto/update-access-menu.dto';
import { UpdateAccessRoleDto } from './dto/update-access-role.dto';
import { UpdateRoleMenuAccessDto } from './dto/update-role-menu-access.dto';
import { UpdateRolePermissionAccessDto } from './dto/update-role-permission-access.dto';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard, UserTypeGuard)
@Roles(UserRole.ADMIN)
@UserTypes(UserType.SYSTEM_ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminSettingsController {
  constructor(private readonly service: AdminSettingsService) {}

  @Get('menus')
  async listMenus(@Query() query: ListAccessQueryDto) {
    return this.service.listMenus(query);
  }

  @Post('menus')
  async createMenu(@Body() dto: CreateAccessMenuDto) {
    return this.service.createMenu(dto);
  }

  @Get('menus/:id')
  async getMenu(@Param('id') id: string) {
    return this.service.getMenu(id);
  }

  @Patch('menus/:id')
  async updateMenu(@Param('id') id: string, @Body() dto: UpdateAccessMenuDto) {
    return this.service.updateMenu(id, dto);
  }

  @Patch('menus/:id/archive')
  async archiveMenu(@Param('id') id: string) {
    return this.service.archiveMenu(id);
  }

  @Patch('menus/:id/restore')
  async restoreMenu(@Param('id') id: string) {
    return this.service.restoreMenu(id);
  }

  @Get('roles')
  async listRoles(@Query() query: ListAccessQueryDto) {
    return this.service.listRoles(query);
  }

  @Post('roles')
  async createRole(@Body() dto: CreateAccessRoleDto) {
    return this.service.createRole(dto);
  }

  @Get('roles/:id')
  async getRole(@Param('id') id: string) {
    return this.service.getRole(id);
  }

  @Patch('roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateAccessRoleDto) {
    return this.service.updateRole(id, dto);
  }

  @Patch('roles/:id/archive')
  async archiveRole(@Param('id') id: string) {
    return this.service.archiveRole(id);
  }

  @Patch('roles/:id/restore')
  async restoreRole(@Param('id') id: string) {
    return this.service.restoreRole(id);
  }

  @Get('roles/:id/access')
  async getRoleAccess(@Param('id') id: string) {
    return this.service.getRoleAccess(id);
  }

  @Put('roles/:id/access/menus')
  async updateRoleMenuAccess(
    @Param('id') id: string,
    @Body() dto: UpdateRoleMenuAccessDto,
  ) {
    return this.service.updateRoleMenuAccess(id, dto);
  }

  @Put('roles/:id/access/permissions')
  async updateRolePermissionAccess(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionAccessDto,
  ) {
    return this.service.updateRolePermissionAccess(id, dto);
  }
}
