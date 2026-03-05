import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
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
  @IsPositive()
  priceMonthly?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxProperties?: number;
}
