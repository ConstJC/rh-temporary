import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class AdminUpdatePropertyGroupDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'SUSPENDED';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @Length(2, 120)
  groupName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @Length(3, 3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @Length(2, 120)
  timezone?: string;
}
