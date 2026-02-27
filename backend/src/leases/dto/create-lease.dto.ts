import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaseType } from '../../generated/prisma/client';

export class CreateLeaseDto {
  @ApiProperty({ description: 'Tenant cuid' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'Unit cuid' })
  @IsString()
  unitId: string;

  @ApiProperty({ enum: LeaseType, example: 'MONTHLY' })
  @IsEnum(LeaseType)
  leaseType: LeaseType;

  @ApiPropertyOptional({ example: 5, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  @Type(() => Number)
  billingDay?: number = 1;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  advanceMonths?: number = 1;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  gracePeriodDays?: number = 3;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  moveInDate: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentAmount: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  securityDeposit: number;
}
