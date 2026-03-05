import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../generated/prisma/client';
import { createAuditTrail } from '../common/helpers/audit.helper';
import { checkSubscriptionLimit } from '../common/helpers/subscription-limit.helper';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PaginationDto, PaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async createProperty(pgId: string, userId: string, dto: CreatePropertyDto) {
    await checkSubscriptionLimit(this.prisma, pgId, 'property');
    const property = await this.prisma.property.create({
      data: {
        propertyGroupId: pgId,
        propertyType: dto.propertyType,
        propertyName: dto.propertyName,
        addressLine: dto.addressLine,
        city: dto.city,
        province: dto.province ?? undefined,
        postalCode: dto.postalCode ?? undefined,
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.INSERT,
      tableName: 'properties',
      recordId: property.id,
      newValues: property as any,
    });
    return property;
  }

  async findAllProperties(pgId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { propertyGroupId: pgId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({
        where: { propertyGroupId: pgId, deletedAt: null },
      }),
    ]);
    const unitCounts = await Promise.all(
      items.map(async (p) => {
        const groups = await this.prisma.unit.groupBy({
          by: ['status'],
          where: { propertyId: p.id, deletedAt: null },
          _count: true,
        });
        const total = groups.reduce((s, g) => s + g._count, 0);
        const occupied =
          groups.find((g) => g.status === 'OCCUPIED')?._count ?? 0;
        const available =
          groups.find((g) => g.status === 'AVAILABLE')?._count ?? 0;
        const maintenance =
          groups.find((g) => g.status === 'MAINTENANCE')?._count ?? 0;
        return { total, occupied, available, maintenance };
      }),
    );
    const data = items.map((p, i) => ({
      ...p,
      unitCount: unitCounts[i],
    }));
    const meta: PaginationMeta = { page, limit, total };
    return { data, meta };
  }

  async updateProperty(
    pgId: string,
    propertyId: string,
    userId: string,
    dto: UpdatePropertyDto,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, propertyGroupId: pgId, deletedAt: null },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    const oldValues = { ...property };
    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(dto.propertyType != null && { propertyType: dto.propertyType }),
        ...(dto.propertyName != null && { propertyName: dto.propertyName }),
        ...(dto.addressLine != null && { addressLine: dto.addressLine }),
        ...(dto.city != null && { city: dto.city }),
        ...(dto.province != null && { province: dto.province }),
        ...(dto.postalCode != null && { postalCode: dto.postalCode }),
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'properties',
      recordId: propertyId,
      oldValues: oldValues as any,
      newValues: updated as any,
    });
    return updated;
  }

  async deleteProperty(pgId: string, propertyId: string, userId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, propertyGroupId: pgId, deletedAt: null },
      include: { units: { where: { deletedAt: null }, take: 1 } },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    const occupiedUnit = await this.prisma.unit.findFirst({
      where: { propertyId, deletedAt: null, status: 'OCCUPIED' },
    });
    if (occupiedUnit) {
      throw new ConflictException('Cannot delete property with OCCUPIED units');
    }
    const activeLease = await this.prisma.lease.findFirst({
      where: { unit: { propertyId }, status: 'ACTIVE', deletedAt: null },
    });
    if (activeLease) {
      throw new ConflictException(
        'Cannot delete property with units that have ACTIVE leases',
      );
    }
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { deletedAt: new Date() },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.DELETE,
      tableName: 'properties',
      recordId: propertyId,
      oldValues: property as any,
    });
  }

  async createUnit(propertyId: string, userId: string, dto: CreateUnitDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    await checkSubscriptionLimit(this.prisma, property.propertyGroupId, 'unit');
    const unit = await this.prisma.unit.create({
      data: {
        propertyId,
        unitType: dto.unitType,
        unitName: dto.unitName,
        monthlyRent: dto.monthlyRent,
        floorNumber: dto.floorNumber ?? undefined,
        maxOccupants: dto.maxOccupants ?? undefined,
        status: 'AVAILABLE',
        metadata: (dto.metadata ?? undefined) as any,
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.INSERT,
      tableName: 'units',
      recordId: unit.id,
      newValues: unit as any,
    });
    return unit;
  }

  async findUnitsByProperty(
    propertyId: string,
    pagination: PaginationDto,
    status?: string,
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const where: any = { propertyId, deletedAt: null };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { unitName: 'asc' },
        include: {
          leases: {
            where: { status: 'ACTIVE', deletedAt: null },
            take: 1,
            include: {
              tenant: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.unit.count({ where }),
    ]);
    const data = items.map((u) => {
      const { leases, ...rest } = u;
      const activeTenantName =
        leases?.[0]?.tenant &&
        `${leases[0].tenant.firstName} ${leases[0].tenant.lastName}`.trim();
      return { ...rest, activeTenantName: activeTenantName || undefined };
    });
    const meta: PaginationMeta = { page, limit, total };
    return { data, meta };
  }

  async updateUnit(unitId: string, userId: string, dto: UpdateUnitDto) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, deletedAt: null },
      include: { property: true },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    if (dto.status === 'MAINTENANCE' || dto.status === 'NOT_AVAILABLE') {
      const activeLease = await this.prisma.lease.findFirst({
        where: { unitId, status: 'ACTIVE', deletedAt: null },
      });
      if (activeLease) {
        throw new ConflictException(
          'Cannot set unit to MAINTENANCE/NOT_AVAILABLE while it has an ACTIVE lease',
        );
      }
    }
    const oldValues = { ...unit };
    const updated = await this.prisma.unit.update({
      where: { id: unitId },
      data: {
        ...(dto.unitType != null && { unitType: dto.unitType }),
        ...(dto.unitName != null && { unitName: dto.unitName }),
        ...(dto.monthlyRent != null && { monthlyRent: dto.monthlyRent }),
        ...(dto.floorNumber != null && { floorNumber: dto.floorNumber }),
        ...(dto.maxOccupants != null && { maxOccupants: dto.maxOccupants }),
        ...(dto.status != null && { status: dto.status }),
        ...(dto.metadata != null && { metadata: dto.metadata as any }),
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'units',
      recordId: unitId,
      oldValues: oldValues as any,
      newValues: updated as any,
    });
    return updated;
  }

  async deleteUnit(unitId: string, userId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, deletedAt: null },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    if (unit.status === 'OCCUPIED') {
      throw new ConflictException('Cannot delete OCCUPIED unit');
    }
    const activeLease = await this.prisma.lease.findFirst({
      where: { unitId, status: 'ACTIVE', deletedAt: null },
    });
    if (activeLease) {
      throw new ConflictException('Cannot delete unit with ACTIVE lease');
    }
    await this.prisma.unit.update({
      where: { id: unitId },
      data: { deletedAt: new Date() },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.DELETE,
      tableName: 'units',
      recordId: unitId,
      oldValues: unit as any,
    });
  }
}
