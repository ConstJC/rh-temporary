import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) {
      throw new ForbiddenException('Unauthorized');
    }
    let pgId = request.params.pgId ?? request.params.id;
    if (!pgId && request.params.propId) {
      const prop = await this.prisma.property.findFirst({
        where: { id: request.params.propId, deletedAt: null },
        select: { propertyGroupId: true },
      });
      pgId = prop?.propertyGroupId ?? null;
    }
    if (!pgId && request.params.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: request.params.unitId, deletedAt: null },
        include: { property: { select: { propertyGroupId: true } } },
      });
      pgId = unit?.property?.propertyGroupId ?? null;
    }
    if (!pgId) {
      throw new ForbiddenException('Property group ID required');
    }
    const member = await this.prisma.propertyGroupMember.findFirst({
      where: {
        propertyGroupId: pgId,
        userId: user.id,
        deletedAt: null,
      },
      include: { role: true },
    });
    if (!member) {
      throw new ForbiddenException(
        'You do not have access to this property group',
      );
    }
    request.orgMember = member;
    request.propertyGroupId = pgId;
    return true;
  }
}
