import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateRoleMenuAccessDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  menuCodes!: string[];
}
