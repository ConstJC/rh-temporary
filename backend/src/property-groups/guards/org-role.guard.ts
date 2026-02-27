import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ORG_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const orgMember = request.orgMember;
    if (!orgMember?.role?.code) {
      throw new ForbiddenException('Not a member of this property group');
    }
    const hasRole = requiredRoles.some((code) => orgMember.role.code === code);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient role for this action');
    }
    return true;
  }
}
