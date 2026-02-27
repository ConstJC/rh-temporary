import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { UnitStatus } from '../../generated/prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListUnitsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: UnitStatus })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}
