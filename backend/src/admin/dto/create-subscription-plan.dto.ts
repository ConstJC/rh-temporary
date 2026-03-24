import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  name!: string;

  @IsNumber()
  @Min(0)
  priceMonthly!: number;

  @IsInt()
  @Min(0)
  maxUnits!: number;

  @IsInt()
  @Min(0)
  maxProperties!: number;

  @IsInt()
  @Min(0)
  maxUnitsPerProperty!: number;

  @IsInt()
  @Min(0)
  maxTenants!: number;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  menuCodes!: string[];

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}
