import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UserRole, UserType } from '../../generated/prisma/client';

export class CreateAdminUserPropertyGroupDto {
  @ApiProperty({ example: 'Acme Property Group' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  groupName: string;

  @ApiPropertyOptional({ example: 'PHP', default: 'PHP' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencyCode?: string = 'PHP';

  @ApiPropertyOptional({ example: 'Asia/Manila', default: 'Asia/Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string = 'Asia/Manila';
}

export class CreateAdminUserDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADMIN })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: UserType, example: UserType.LANDLORD })
  @IsEnum(UserType)
  userType: UserType;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ example: '+639171234567' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ type: () => CreateAdminUserPropertyGroupDto })
  @ValidateIf((dto: CreateAdminUserDto) => dto.userType === UserType.LANDLORD)
  @IsDefined({
    message: 'propertyGroup is required when userType is LANDLORD',
  })
  @ValidateNested()
  @Type(() => CreateAdminUserPropertyGroupDto)
  propertyGroup?: CreateAdminUserPropertyGroupDto;
}
