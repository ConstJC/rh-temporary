import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType } from '../../generated/prisma/client';

export class CreateUnitDto {
  @ApiProperty({ enum: UnitType, example: 'BEDROOM' })
  @IsEnum(UnitType)
  unitType: UnitType;

  @ApiProperty({ example: 'Room 101' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  unitName: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyRent: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  floorNumber?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxOccupants?: number;

  @ApiPropertyOptional({ example: { furnished: true, sqm: 18 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
