import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from './access-control.service';
import { REQUIRE_MENU_KEY } from './decorators/require-menu.decorator';
import { REQUIRE_PERMISSION_KEY } from './decorators/require-permission.decorator';

@Injectable()
export class PlanAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredMenu = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRE_MENU_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermission =
      this.reflector.getAllAndOverride<string | undefined>(
        REQUIRE_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredMenu && !requiredPermission) {
      return true;
    }

    const isEnabled =
      this.configService.get<boolean>('app.planEntitlementsEnabled') === true;
    if (!isEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.user?.userType === 'SYSTEM_ADMIN') {
      return true;
    }

    const propertyGroupId =
      await this.accessControlService.resolvePropertyGroupIdFromRequest(request);

    if (!propertyGroupId) {
      throw new ForbiddenException({
        error: {
          code: 'PLAN_ACCESS_DENIED',
          message:
            'Your current subscription plan does not include this feature.',
          details: {
            menu: requiredMenu ?? null,
            permission: requiredPermission ?? null,
          },
        },
      });
    }

    let access: Awaited<
      ReturnType<AccessControlService['getAccessContext']>
    >;
    try {
      access = await this.accessControlService.getAccessContext(propertyGroupId);
    } catch {
      throw new ForbiddenException({
        error: {
          code: 'PLAN_ACCESS_DENIED',
          message:
            'Your current subscription plan does not include this feature.',
          details: {
            menu: requiredMenu ?? null,
            permission: requiredPermission ?? null,
          },
        },
      });
    }

    if (requiredMenu && !access.menuSet.has(requiredMenu)) {
      throw new ForbiddenException({
        error: {
          code: 'PLAN_ACCESS_DENIED',
          message:
            'Your current subscription plan does not include this feature.',
          details: {
            menu: requiredMenu,
            permission: requiredPermission ?? null,
          },
        },
      });
    }

    if (requiredPermission && !access.permissionSet.has(requiredPermission)) {
      throw new ForbiddenException({
        error: {
          code: 'PLAN_ACCESS_DENIED',
          message:
            'Your current subscription plan does not include this feature.',
          details: {
            menu: requiredMenu ?? null,
            permission: requiredPermission,
          },
        },
      });
    }

    request.planAccess = {
      planName: access.planName,
      menus: access.menus,
      permissions: access.permissions,
    };

    return true;
  }
}
