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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types';
import { OrgMemberGuard } from '../property-groups/guards/org-member.guard';
import { OrgRoleGuard } from '../property-groups/guards/org-role.guard';
import { OrgRoles } from '../property-groups/decorators/org-roles.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';

@ApiTags('Properties')
@Controller()
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // Nested under property-groups
  @Post('property-groups/:pgId/properties')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Create a property' })
  @ApiResponse({ status: 201, description: 'Property created' })
  @ApiResponse({ status: 402, description: 'Plan limit exceeded' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createProperty(
    @Param('pgId') pgId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.createProperty(pgId, user.sub, dto);
  }

  @Get('property-groups/:pgId/properties')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'List properties with unit count summary' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllProperties(
    @Param('pgId') pgId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.propertiesService.findAllProperties(pgId, pagination);
  }

  @Patch('property-groups/:pgId/properties/:id')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Update a property' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateProperty(
    @Param('pgId') pgId: string,
    @Param('id') propertyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateProperty(
      pgId,
      propertyId,
      user.sub,
      dto,
    );
  }

  @Delete('property-groups/:pgId/properties/:id')
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @OrgRoles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a property (OWNER only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 409,
    description: 'Has OCCUPIED units or ACTIVE leases',
  })
  async deleteProperty(
    @Param('pgId') pgId: string,
    @Param('id') propertyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.propertiesService.deleteProperty(pgId, propertyId, user.sub);
  }

  @Post('properties/:propId/units')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Create a unit' })
  @ApiResponse({ status: 201, description: 'Unit created' })
  @ApiResponse({ status: 402, description: 'Plan limit exceeded' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createUnit(
    @Param('propId') propId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateUnitDto,
  ) {
    return this.propertiesService.createUnit(propId, user.sub, dto);
  }

  @Get('properties/:propId/units')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'List units (optional status filter)' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findUnitsByProperty(
    @Param('propId') propId: string,
    @Query() query: ListUnitsQueryDto,
  ) {
    const { page, limit, status } = query;
    return this.propertiesService.findUnitsByProperty(
      propId,
      { page, limit },
      status,
    );
  }

  @Patch('units/:unitId')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Update a unit' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 409,
    description: 'Cannot set MAINTENANCE with ACTIVE lease',
  })
  async updateUnit(
    @Param('unitId') unitId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.propertiesService.updateUnit(unitId, user.sub, dto);
  }

  @Delete('units/:unitId')
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @OrgRoles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a unit (OWNER only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 409,
    description: 'Unit OCCUPIED or has ACTIVE lease',
  })
  async deleteUnit(
    @Param('unitId') unitId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.propertiesService.deleteUnit(unitId, user.sub);
  }
}
