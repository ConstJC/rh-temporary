import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';

export class ListAccessQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['SYSTEM_ADMIN', 'LANDLORD', 'BOTH'])
  scope?: 'SYSTEM_ADMIN' | 'LANDLORD' | 'BOTH';

  @IsOptional()
  @IsBooleanString()
  includeArchived?: string;
}
