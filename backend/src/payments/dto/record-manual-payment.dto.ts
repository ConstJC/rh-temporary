import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional, IsObject, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../generated/prisma/client';

export class RecordManualPaymentDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amountPaid: number;

  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  datePaid: string;

  @ApiPropertyOptional({ example: { notes: 'Collected in person, receipt #001' } })
  @IsOptional()
  @IsObject()
  paymentDetails?: Record<string, unknown>;
}
