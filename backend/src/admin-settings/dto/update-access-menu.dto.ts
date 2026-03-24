import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateAccessMenuDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  label?: string;

  @IsOptional()
  @IsIn(['SYSTEM_ADMIN', 'LANDLORD', 'BOTH'])
  scope?: 'SYSTEM_ADMIN' | 'LANDLORD' | 'BOTH';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  routePattern?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  iconKey?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
