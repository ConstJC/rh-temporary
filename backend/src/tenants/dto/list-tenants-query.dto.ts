import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { TenantStatus } from '../../generated/prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListTenantsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
