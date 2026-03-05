import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types';
import { OrgMemberGuard } from './guards/org-member.guard';
import { OrgRoleGuard } from './guards/org-role.guard';
import { OrgRoles } from './decorators/org-roles.decorator';
import { PropertyGroupsService } from './property-groups.service';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@ApiTags('Property Groups')
@Controller('property-groups')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
@ApiBearerAuth('JWT-auth')
export class PropertyGroupsController {
  constructor(private readonly propertyGroupsService: PropertyGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a property group (org)' })
  @ApiResponse({ status: 201, description: 'Property group created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePropertyGroupDto,
  ) {
    return this.propertyGroupsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List property groups for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of property groups with subscription',
  })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.propertyGroupsService.findAll(user.sub);
  }

  @Patch(':id')
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @OrgRoles('OWNER')
  @ApiOperation({ summary: 'Update property group (OWNER only)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePropertyGroupDto,
  ) {
    return this.propertyGroupsService.update(id, user.sub, dto);
  }

  @Get(':id/members')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'List members of property group' })
  @ApiResponse({ status: 200, description: 'List of members' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findMembers(@Param('id') id: string) {
    return this.propertyGroupsService.findMembers(id);
  }

  @Post(':id/members')
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @OrgRoles('OWNER')
  @ApiOperation({ summary: 'Invite/add member (OWNER only)' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async addMember(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteMemberDto,
  ) {
    return this.propertyGroupsService.addMember(id, user.sub, dto);
  }

  @Patch(':id/members/:mId')
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @OrgRoles('OWNER')
  @ApiOperation({ summary: 'Update member role (OWNER only)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 400, description: 'Cannot demote last OWNER' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('mId') mId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.propertyGroupsService.updateMemberRole(id, mId, user.sub, dto);
  }

  @Delete(':id/members/:mId')
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @OrgRoles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member (OWNER only)' })
  @ApiResponse({ status: 204, description: 'Removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove last OWNER' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeMember(
    @Param('id') id: string,
    @Param('mId') mId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.propertyGroupsService.removeMember(id, mId, user.sub);
  }

  @Get(':id/subscription')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Get subscription and usage for property group' })
  @ApiResponse({ status: 200, description: 'Subscription and usage' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSubscription(@Param('id') id: string) {
    return this.propertyGroupsService.getSubscription(id);
  }
}
