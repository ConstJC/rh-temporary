import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../../generated/prisma/client';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;
}
