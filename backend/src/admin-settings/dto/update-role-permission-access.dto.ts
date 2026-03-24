import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateRolePermissionAccessDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}
