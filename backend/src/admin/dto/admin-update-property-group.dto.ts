import { IsIn, IsOptional, IsString } from 'class-validator';

export class AdminUpdatePropertyGroupDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'SUSPENDED';

  @IsOptional()
  @IsString()
  notes?: string;
}

