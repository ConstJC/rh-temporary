import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../../generated/prisma/client';
import { USER_TYPES_KEY } from '../decorators/user-type.decorator';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserTypes = this.reflector.getAllAndOverride<UserType[]>(
      USER_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredUserTypes?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const hasType = requiredUserTypes.some((t) => user.userType === t);
    if (!hasType) {
      throw new ForbiddenException('Insufficient user type for this action');
    }
    return true;
  }
}
