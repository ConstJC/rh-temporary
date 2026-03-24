import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateAccessMenuDto } from './dto/create-access-menu.dto';
import { CreateAccessRoleDto } from './dto/create-access-role.dto';
import { ListAccessQueryDto } from './dto/list-access-query.dto';
import { UpdateAccessMenuDto } from './dto/update-access-menu.dto';
import { UpdateAccessRoleDto } from './dto/update-access-role.dto';
import { UpdateRoleMenuAccessDto } from './dto/update-role-menu-access.dto';
import { UpdateRolePermissionAccessDto } from './dto/update-role-permission-access.dto';

@Injectable()
export class AdminSettingsService {
  async listMenus(_query: ListAccessQueryDto) {
    throw new NotImplementedException('TODO: implement listMenus');
  }

  async createMenu(_dto: CreateAccessMenuDto) {
    throw new NotImplementedException('TODO: implement createMenu');
  }

  async getMenu(_id: string) {
    throw new NotImplementedException('TODO: implement getMenu');
  }

  async updateMenu(_id: string, _dto: UpdateAccessMenuDto) {
    throw new NotImplementedException('TODO: implement updateMenu');
  }

  async archiveMenu(_id: string) {
    throw new NotImplementedException('TODO: implement archiveMenu');
  }

  async restoreMenu(_id: string) {
    throw new NotImplementedException('TODO: implement restoreMenu');
  }

  async listRoles(_query: ListAccessQueryDto) {
    throw new NotImplementedException('TODO: implement listRoles');
  }

  async createRole(_dto: CreateAccessRoleDto) {
    throw new NotImplementedException('TODO: implement createRole');
  }

  async getRole(_id: string) {
    throw new NotImplementedException('TODO: implement getRole');
  }

  async updateRole(_id: string, _dto: UpdateAccessRoleDto) {
    throw new NotImplementedException('TODO: implement updateRole');
  }

  async archiveRole(_id: string) {
    throw new NotImplementedException('TODO: implement archiveRole');
  }

  async restoreRole(_id: string) {
    throw new NotImplementedException('TODO: implement restoreRole');
  }

  async getRoleAccess(_id: string) {
    throw new NotImplementedException('TODO: implement getRoleAccess');
  }

  async updateRoleMenuAccess(_id: string, _dto: UpdateRoleMenuAccessDto) {
    throw new NotImplementedException('TODO: implement updateRoleMenuAccess');
  }

  async updateRolePermissionAccess(
    _id: string,
    _dto: UpdateRolePermissionAccessDto,
  ) {
    throw new NotImplementedException(
      'TODO: implement updateRolePermissionAccess',
    );
  }
}
