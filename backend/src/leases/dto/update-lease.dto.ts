import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLeaseDto {
  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  moveOutDate?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  gracePeriodDays?: number;

  @ApiPropertyOptional({ example: 5500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentAmount?: number;
}
