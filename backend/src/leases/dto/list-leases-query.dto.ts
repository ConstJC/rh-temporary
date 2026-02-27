import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { LeaseStatus } from '../../generated/prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListLeasesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LeaseStatus })
  @IsOptional()
  @IsEnum(LeaseStatus)
  status?: LeaseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}
