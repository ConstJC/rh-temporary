import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsIn } from 'class-validator';

export class CloseLeaseDto {
  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  moveOutDate: string;

  @ApiPropertyOptional({
    example: 'REFUNDED',
    enum: ['REFUNDED', 'FORFEITED', 'APPLIED_TO_RENT', 'OTHER'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['REFUNDED', 'FORFEITED', 'APPLIED_TO_RENT', 'OTHER'])
  depositDisposition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
