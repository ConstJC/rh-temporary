import { UserRole, UserType } from '../../generated/prisma/client';

/** Fields selected for any user API response (excludes password, tokens, deletedAt) */
export const USER_RESPONSE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  userType: true,
  phone: true,
  isEmailVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * User data returned in API responses
 */
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userType: UserType;
  phone: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data for profile updates
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userType: UserType;
  phone: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
 * Paginated users response
 */
export interface PaginatedUsersResponse {
  users: UserResponse[];
  pagination: PaginationMeta;
}

/**
 * User role update response
 */
export interface UpdateRoleResponse extends UserResponse {}

/**
 * User activation/deactivation response
 */
export interface UserStatusResponse extends UserResponse {}

/**
 * User deletion response
 */
export interface DeleteUserResponse {
  message: string;
}

/**
 * User restoration response
 */
export interface RestoreUserResponse extends UserResponse {}

/**
 * Query parameters for user listing
 */
export interface UserListQuery {
  page?: number;
  limit?: number;
}

/**
 * User data for database operations
 */
export interface UserForUpdate {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data for soft delete operations
 */
export interface UserForSoftDelete {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data for restoration operations
 */
export interface UserForRestore {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
