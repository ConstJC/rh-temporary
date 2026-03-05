import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PropertyType } from '../../generated/prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ enum: PropertyType, example: 'BOARDING_HOUSE' })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty({ example: 'DC Pension House' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  propertyName: string;

  @ApiProperty({ example: '123 Rizal St.' })
  @IsString()
  @MinLength(1)
  addressLine: string;

  @ApiProperty({ example: 'Quezon City' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 'Metro Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional({ example: '1100' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;
}
