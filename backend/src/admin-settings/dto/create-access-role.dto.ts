import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAccessRoleDto {
  @IsString()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code!: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  name!: string;

  @IsIn(['SYSTEM_ADMIN', 'LANDLORD', 'BOTH'])
  scope!: 'SYSTEM_ADMIN' | 'LANDLORD' | 'BOTH';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
