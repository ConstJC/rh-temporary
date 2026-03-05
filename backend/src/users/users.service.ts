import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { UserRole } from '../generated/prisma/client';
import {
  UserResponse,
  PaginatedUsersResponse,
  UpdateRoleResponse,
  UserStatusResponse,
  DeleteUserResponse,
  RestoreUserResponse,
  UserListQuery,
  USER_RESPONSE_SELECT,
} from './types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedUsersResponse> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: USER_RESPONSE_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: USER_RESPONSE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findMe(userId: string): Promise<UserResponse> {
    return this.findOne(userId);
  }

  async updateMe(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: USER_RESPONSE_SELECT,
    });

    return updatedUser;
  }

  async updateRole(
    userId: string,
    updateUserRoleDto: UpdateUserRoleDto,
    currentUserId: string,
  ): Promise<UpdateRoleResponse> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if trying to update own role
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot update your own role');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: updateUserRoleDto.role as UserRole },
      select: USER_RESPONSE_SELECT,
    });

    return updatedUser;
  }

  async deactivateUser(
    userId: string,
    currentUserId: string,
  ): Promise<UserStatusResponse> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if trying to deactivate own account
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: USER_RESPONSE_SELECT,
    });

    return updatedUser;
  }

  async activateUser(userId: string): Promise<UserStatusResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: USER_RESPONSE_SELECT,
    });

    return updatedUser;
  }

  async softDeleteUser(
    userId: string,
    currentUserId: string,
  ): Promise<DeleteUserResponse> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if trying to delete own account
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Also invalidate all refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'User deleted successfully' };
  }

  async restoreUser(userId: string): Promise<RestoreUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    const restoredUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        isActive: true,
      },
      select: USER_RESPONSE_SELECT,
    });

    return restoredUser;
  }
}
