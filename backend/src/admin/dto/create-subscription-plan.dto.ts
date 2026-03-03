import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  name!: string;

  @IsNumber()
  @IsPositive()
  priceMonthly!: number;

  @IsInt()
  @Min(0)
  maxUnits!: number;

  @IsInt()
  @Min(0)
  maxProperties!: number;
}

