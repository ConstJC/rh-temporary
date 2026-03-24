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

export class CreateAccessMenuDto {
  @IsString()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code!: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  label!: string;

  @IsIn(['SYSTEM_ADMIN', 'LANDLORD', 'BOTH'])
  scope!: 'SYSTEM_ADMIN' | 'LANDLORD' | 'BOTH';

  @IsString()
  @Transform(({ value }) => String(value).trim())
  routePattern!: string;

  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder!: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  iconKey?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
