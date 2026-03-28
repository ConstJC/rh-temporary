import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminPropertyGroupDto {
  @ApiProperty({ example: 'Acme Property Group' })
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

  @ApiProperty({ example: 'cuid_of_landlord_user' })
  @IsString()
  ownerUserId: string;
}
