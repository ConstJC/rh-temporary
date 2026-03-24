import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MENU_KEY = 'requireMenu';

export const RequireMenu = (menuCode: string) =>
  SetMetadata(REQUIRE_MENU_KEY, menuCode);
