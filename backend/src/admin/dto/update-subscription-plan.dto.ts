import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxProperties?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxUnitsPerProperty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxTenants?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  menuCodes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes?: string[];
}
