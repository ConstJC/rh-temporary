import { UserRole, UserType } from '../../generated/prisma/client';

/**
 * JWT Payload interface for access tokens
 */
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  userType: UserType;
}

/**
 * JWT Payload interface for refresh tokens
 */
export interface JwtRefreshPayload extends JwtPayload {
  token: string; // random token for refresh token validation
}

/**
 * User data returned after successful authentication
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
}

/**
 * User data returned after successful login
 */
export interface LoginUser {
  id: string;
  email: string;
  role: UserRole;
  userType: UserType;
  isEmailVerified: boolean;
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Registration response (201)
 */
export interface RegisterResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
}

/**
 * Login response (wrapped in { data } by interceptor)
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
}

/**
 * Token refresh response (same shape as login)
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
}

/**
 * Logout response (204 No Content)
 */
export interface LogoutResponse {
  message?: string;
}

/**
 * Email verification response
 */
export interface VerifyEmailResponse {
  message: string;
}

/**
 * Password reset request response
 */
export interface RequestPasswordResetResponse {
  message: string;
}

/**
 * Password reset response
 */
export interface ResetPasswordResponse {
  message: string;
}

/**
 * User data for email verification
 */
export interface UserForEmailVerification {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerificationToken: string | null;
  isEmailVerified: boolean;
}

/**
 * User data for password reset
 */
export interface UserForPasswordReset {
  id: string;
  email: string;
  firstName: string;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
}

/**
 * Refresh token record from database
 */
export interface RefreshTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    deletedAt: Date | null;
    isActive: boolean;
  };
}
