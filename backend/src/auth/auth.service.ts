import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserType } from '../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  LoginUser,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  VerifyEmailResponse,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
  JwtPayload,
} from './types';
import { AUTH_CONSTANTS } from './constants/auth.constants';

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException(AUTH_CONSTANTS.ERRORS.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(
      password,
      AUTH_CONSTANTS.PASSWORD.SALT_ROUNDS,
    );
    const emailVerificationToken = crypto
      .randomBytes(AUTH_CONSTANTS.TOKEN.EMAIL_VERIFICATION_LENGTH)
      .toString('hex');
    const emailVerificationExpires = new Date(
      Date.now() + AUTH_CONSTANTS.EXPIRATION.EMAIL_VERIFICATION,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER',
        userType: UserType.LANDLORD,
        isEmailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
      },
    });

    await this.mailService.sendEmailVerification(
      email,
      emailVerificationToken,
      firstName,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(
        AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(AUTH_CONSTANTS.ERRORS.ACCOUNT_LOCKED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const failedAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const updates: {
        failedLoginAttempts: number;
        lockedUntil?: Date;
        isActive?: boolean;
      } = {
        failedLoginAttempts: failedAttempts,
      };
      if (failedAttempts >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS) {
        updates.lockedUntil = new Date(
          Date.now() + AUTH_CONSTANTS.EXPIRATION.LOCKOUT,
        );
        updates.isActive = false;
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      throw new UnauthorizedException(
        AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, isActive: true },
    });

    const { accessToken, refreshToken } = await this.generateTokens(user);
    const loginUser: LoginUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
    };
    return { accessToken, refreshToken, user: loginUser };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponse> {
    const { refreshToken } = refreshTokenDto;
    const tokenHash = hashRefreshToken(refreshToken);

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.user.deletedAt ||
      !tokenRecord.user.isActive
    ) {
      throw new UnauthorizedException(
        AUTH_CONSTANTS.ERRORS.INVALID_REFRESH_TOKEN,
      );
    }
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException(
        AUTH_CONSTANTS.ERRORS.REFRESH_TOKEN_EXPIRED,
      );
    }

    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(tokenRecord.user);
    const loginUser: LoginUser = {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      userType: tokenRecord.user.userType,
      isEmailVerified: tokenRecord.user.isEmailVerified,
    };
    return { accessToken, refreshToken: newRefreshToken, user: loginUser };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({
      where: { token: tokenHash },
    });
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponse> {
    const { token } = verifyEmailDto;

    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        AUTH_CONSTANTS.ERRORS.INVALID_VERIFICATION_TOKEN,
      );
    }
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException(
        AUTH_CONSTANTS.ERRORS.INVALID_VERIFICATION_TOKEN,
      );
    }
    if (user.isEmailVerified) {
      throw new BadRequestException(
        AUTH_CONSTANTS.ERRORS.EMAIL_ALREADY_VERIFIED,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<RequestPasswordResetResponse> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (user) {
      const resetToken = crypto
        .randomBytes(AUTH_CONSTANTS.TOKEN.PASSWORD_RESET_LENGTH)
        .toString('hex');
      const resetExpires = new Date(
        Date.now() + AUTH_CONSTANTS.EXPIRATION.PASSWORD_RESET,
      );
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        },
      });
      await this.mailService.sendPasswordReset(
        email,
        resetToken,
        user.firstName,
      );
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException(AUTH_CONSTANTS.ERRORS.INVALID_RESET_TOKEN);
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      AUTH_CONSTANTS.PASSWORD.SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await this.mailService.sendPasswordChanged(user.email, user.firstName);

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
    userType: UserType;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      userType: user.userType,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshTokenPlain = crypto
      .randomBytes(AUTH_CONSTANTS.TOKEN.REFRESH_TOKEN_LENGTH)
      .toString('hex');
    const refreshTokenHash = hashRefreshToken(refreshTokenPlain);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenHash,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + AUTH_CONSTANTS.EXPIRATION.REFRESH_TOKEN,
        ),
      },
    });

    return { accessToken, refreshToken: refreshTokenPlain };
  }
}
