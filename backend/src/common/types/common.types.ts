import { UserRole } from '../../generated/prisma/client';

/**
 * Common API response structure
 */
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * User context from JWT token
 */
export interface UserContext {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Database entity with timestamps
 */
export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft deletable entity
 */
export interface SoftDeletableEntity extends TimestampedEntity {
  deletedAt: Date | null;
}

/**
 * Active entity
 */
export interface ActiveEntity {
  isActive: boolean;
}

/**
 * Email verification entity
 */
export interface EmailVerifiableEntity {
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
}

/**
 * Password reset entity
 */
export interface PasswordResetEntity {
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
}

/**
 * Base user entity combining all common user properties
 */
export interface BaseUserEntity
  extends SoftDeletableEntity,
    ActiveEntity,
    EmailVerifiableEntity,
    PasswordResetEntity {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * User entity without sensitive data
 */
export interface SafeUserEntity
  extends SoftDeletableEntity,
    ActiveEntity,
    EmailVerifiableEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * JWT token configuration
 */
export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  url: string;
}

/**
 * SMTP configuration
 */
export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/**
 * Throttle configuration
 */
export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
  url: string;
  nodeEnv: string;
}

/**
 * Complete configuration interface
 */
export interface Configuration {
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  app: AppConfig;
  smtp: SmtpConfig;
  throttle: ThrottleConfig;
}
