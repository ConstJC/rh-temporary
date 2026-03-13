import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, UserType } from '../generated/prisma/client';
import { createAuditTrail } from '../common/helpers/audit.helper';
import { checkSubscriptionLimit } from '../common/helpers/subscription-limit.helper';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto, PaginationMeta } from '../common/dto/pagination.dto';
import { MailService } from '../mail/mail.service';
import { AUTH_CONSTANTS } from '../auth/constants/auth.constants';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(pgId: string, userId: string, dto: CreateTenantDto) {
    await checkSubscriptionLimit(this.prisma, pgId, 'tenant');
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const phone = dto.phone.trim();
    const email = normalizeEmail(dto.email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      throw new BadRequestException(
        'Phone number must include at least one numeric digit',
      );
    }

    const [landlord, existingUserByEmail, existingTenantByEmail, tenants] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true },
        }),
        this.prisma.user.findUnique({
          where: { email },
          select: { id: true, deletedAt: true, userType: true },
        }),
        this.prisma.tenant.findFirst({
          where: { email, deletedAt: null },
          select: { id: true },
        }),
        this.prisma.tenant.findMany({
          where: { deletedAt: null },
          select: { id: true, phone: true },
        }),
      ]);

    if (existingUserByEmail) {
      if (existingUserByEmail.userType === UserType.TENANT) {
        throw new ConflictException(
          'A tenant account with this email already exists',
        );
      }
      if (existingUserByEmail.deletedAt) {
        throw new ConflictException(
          'This email is already reserved by an archived account',
        );
      }
      throw new ConflictException(
        'This email is already used by another account',
      );
    }

    if (existingTenantByEmail) {
      throw new ConflictException('A tenant with this email already exists');
    }

    const duplicatePhoneTenant = tenants.find(
      (tenant) => normalizePhone(tenant.phone) === normalizedPhone,
    );
    if (duplicatePhoneTenant) {
      throw new ConflictException(
        'A tenant with this phone number already exists',
      );
    }

    const temporaryPassword = crypto.randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      AUTH_CONSTANTS.PASSWORD.SALT_ROUNDS,
    );
    const setupToken = crypto
      .randomBytes(AUTH_CONSTANTS.TOKEN.PASSWORD_RESET_LENGTH)
      .toString('hex');
    const setupTokenExpires = new Date(
      Date.now() + AUTH_CONSTANTS.EXPIRATION.EMAIL_VERIFICATION,
    );

    const tenant = await this.prisma.$transaction(async (tx) => {
      const tenantUser = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          firstName,
          lastName,
          role: 'USER',
          userType: UserType.TENANT,
          phone,
          isActive: false,
          resetPasswordToken: setupToken,
          resetPasswordExpires: setupTokenExpires,
        },
        select: { id: true },
      });

      const createdTenant = await tx.tenant.create({
        data: {
          firstName,
          lastName,
          phone,
          email,
          emergencyContact: (dto.emergencyContact ?? undefined) as any,
          status: 'ACTIVE',
          userId: tenantUser.id,
        },
      });

      await createAuditTrail(tx as any, {
        userId,
        action: AuditAction.INSERT,
        tableName: 'tenants',
        recordId: createdTenant.id,
        newValues: createdTenant as any,
      });

      return createdTenant;
    });

    const landlordName = [landlord?.firstName, landlord?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const landlordDisplayName =
      landlordName || landlord?.email || 'your landlord';

    try {
      await this.mailService.sendTenantAccountCreatedByLandlord({
        email,
        tenantFirstName: firstName,
        landlordName: landlordDisplayName,
        setupToken,
      });
    } catch (error) {
      this.logger.error(
        `Tenant created but setup email failed for ${email}`,
        error as Error,
      );
    }

    return tenant;
  }

  async findAll(pgId: string, pagination: PaginationDto, status?: string) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const where: any = {
      deletedAt: null,
      propertyGroupId: pgId,
      tenant: { deletedAt: null, ...(status ? { status } : {}) },
      unit: {
        deletedAt: null,
        property: { deletedAt: null },
      },
    };

    const leases = await this.prisma.lease.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        tenant: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            internalNotes: true,
            emergencyContact: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitName: true,
            property: {
              select: { id: true, propertyName: true },
            },
          },
        },
      },
    });

    const preferredLeaseByTenant = new Map<string, (typeof leases)[number]>();
    for (const lease of leases) {
      const existing = preferredLeaseByTenant.get(lease.tenantId);
      if (!existing) {
        preferredLeaseByTenant.set(lease.tenantId, lease);
        continue;
      }

      const currentIsActive = existing.status === 'ACTIVE';
      const nextIsActive = lease.status === 'ACTIVE';
      if (!currentIsActive && nextIsActive) {
        preferredLeaseByTenant.set(lease.tenantId, lease);
        continue;
      }

      const existingTs = existing.createdAt.getTime();
      const nextTs = lease.createdAt.getTime();
      if (nextTs > existingTs) {
        preferredLeaseByTenant.set(lease.tenantId, lease);
      }
    }

    const tenantLeaseRows = Array.from(preferredLeaseByTenant.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = tenantLeaseRows.length;
    const pageRows = tenantLeaseRows.slice(skip, skip + limit);

    const data = pageRows.map((lease) => ({
      id: lease.tenant.id,
      userId: lease.tenant.userId,
      firstName: lease.tenant.firstName,
      lastName: lease.tenant.lastName,
      phone: lease.tenant.phone,
      email: lease.tenant.email,
      internalNotes: lease.tenant.internalNotes,
      emergencyContact: lease.tenant.emergencyContact,
      status: lease.tenant.status,
      createdAt: lease.tenant.createdAt,
      updatedAt: lease.tenant.updatedAt,
      leases: [
        {
          id: lease.id,
          status: lease.status,
          unit: {
            id: lease.unit.id,
            unitName: lease.unit.unitName,
            property: lease.unit.property,
          },
        },
      ],
      activeLease:
        lease.status === 'ACTIVE'
          ? {
              id: lease.id,
              unit: {
                id: lease.unit.id,
                unitName: lease.unit.unitName,
                property: lease.unit.property,
              },
            }
          : undefined,
    }));
    const meta: PaginationMeta = { page, limit, total };
    return { data, meta };
  }

  async findOne(pgId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
        leases: { some: { propertyGroupId: pgId, deletedAt: null } },
      },
      include: {
        leases: {
          where: { propertyGroupId: pgId, deletedAt: null },
          include: {
            unit: {
              select: {
                unitName: true,
                floorNumber: true,
                property: { select: { id: true, propertyName: true } },
              },
            },
          },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const paymentSummary = await this.prisma.payment.aggregate({
      where: {
        lease: { tenantId, propertyGroupId: pgId, deletedAt: null },
        deletedAt: null,
      },
      _sum: { amountDue: true, amountPaid: true },
      _count: true,
    });
    const overdueCount = await this.prisma.payment.count({
      where: {
        lease: { tenantId, propertyGroupId: pgId, deletedAt: null },
        deletedAt: null,
        status: 'OVERDUE',
      },
    });
    const totalDue = Number(paymentSummary._sum.amountDue ?? 0);
    const totalPaid = Number(paymentSummary._sum.amountPaid ?? 0);
    return {
      ...tenant,
      paymentSummary: { totalDue, totalPaid, overdueCount },
    };
  }

  async update(
    pgId: string,
    tenantId: string,
    userId: string,
    dto: UpdateTenantDto,
  ) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
        leases: { some: { propertyGroupId: pgId, deletedAt: null } },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const oldValues = { ...tenant };
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.phone != null && { phone: dto.phone }),
        ...(dto.status != null && { status: dto.status }),
        ...(dto.internalNotes != null && { internalNotes: dto.internalNotes }),
      },
    });
    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.UPDATE,
      tableName: 'tenants',
      recordId: tenantId,
      oldValues: oldValues as any,
      newValues: updated as any,
    });
    return updated;
  }

  async remove(pgId: string, tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
        leases: { some: { propertyGroupId: pgId, deletedAt: null } },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const activeLease = await this.prisma.lease.findFirst({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (activeLease) {
      throw new ConflictException('Cannot delete tenant with ACTIVE lease');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { deletedAt: new Date() },
    });

    await createAuditTrail(this.prisma, {
      userId,
      action: AuditAction.DELETE,
      tableName: 'tenants',
      recordId: tenantId,
      oldValues: tenant as any,
    });
  }
}
