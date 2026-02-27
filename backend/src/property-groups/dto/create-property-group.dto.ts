import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreatePropertyGroupDto {
  @ApiProperty({ example: 'dela Cruz Properties' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  groupName: string;

  @ApiPropertyOptional({ example: 'PHP', default: 'PHP' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currencyCode?: string = 'PHP';

  @ApiPropertyOptional({ example: 'Asia/Manila', default: 'Asia/Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string = 'Asia/Manila';
}
