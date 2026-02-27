import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsIn } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'STAFF', enum: ['OWNER', 'ADMIN', 'STAFF'] })
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'STAFF'])
  roleCode: string;
}
