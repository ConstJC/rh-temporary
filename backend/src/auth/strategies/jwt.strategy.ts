import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

function jwtFromRequest(req: Request): string | null {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (token.startsWith('Bearer ')) token = token.slice(7);
  return token || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>(AUTH_CONSTANTS.JWT.ACCESS_SECRET_KEY) ||
      process.env.JWT_ACCESS_SECRET ||
      AUTH_CONSTANTS.JWT.DEFAULT_ACCESS_SECRET;
    super({
      jwtFromRequest: (req) => jwtFromRequest(req),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
        isEmailVerified: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Try logging in again.');
    }
    if (user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or deactivated.');
    }

    return {
      id: user.id,
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
