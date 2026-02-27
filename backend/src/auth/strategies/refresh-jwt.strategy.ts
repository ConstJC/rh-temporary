import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtRefreshPayload } from '../types';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(AUTH_CONSTANTS.JWT.REFRESH_SECRET_KEY) || process.env.JWT_REFRESH_SECRET || AUTH_CONSTANTS.JWT.DEFAULT_REFRESH_SECRET,
    });
  }

  async validate(payload: JwtRefreshPayload) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: payload.token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!refreshToken || refreshToken.user.deletedAt || !refreshToken.user.isActive) {
      throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.INVALID_REFRESH_TOKEN);
    }

    if (refreshToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({
        where: { id: refreshToken.id },
      });
      throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.REFRESH_TOKEN_EXPIRED);
    }

    return {
      id: refreshToken.user.id,
      email: refreshToken.user.email,
      firstName: refreshToken.user.firstName,
      lastName: refreshToken.user.lastName,
      role: refreshToken.user.role,
      isEmailVerified: refreshToken.user.isEmailVerified,
      refreshTokenId: refreshToken.id,
    };
  }
}
