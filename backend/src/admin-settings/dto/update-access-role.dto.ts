import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAccessRoleDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  name?: string;

  @IsOptional()
  @IsIn(['SYSTEM_ADMIN', 'LANDLORD', 'BOTH'])
  scope?: 'SYSTEM_ADMIN' | 'LANDLORD' | 'BOTH';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
