import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdatePropertyGroupDto {
  @ApiPropertyOptional({ example: 'DC Properties Inc.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  groupName?: string;

  @ApiPropertyOptional({ example: 'Asia/Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: 'PHP' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencyCode?: string;
}
