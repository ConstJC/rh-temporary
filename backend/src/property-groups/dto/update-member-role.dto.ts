import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'ADMIN', enum: ['OWNER', 'ADMIN', 'STAFF'] })
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'STAFF'])
  roleCode: string;
}
