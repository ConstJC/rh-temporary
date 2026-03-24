# Admin Settings Roles/Menus: Prisma Draft + API Contract Stubs

**Date:** 2026-03-19  
**Status:** Draft (Design + Contract)

## 1. Prisma Schema Draft

Use this as a draft patch for `backend/prisma/schema.prisma`.

```prisma
enum AccessScope {
  SYSTEM_ADMIN
  LANDLORD
  BOTH

  @@map("access_scope_enum")
}

model AccessRole {
  id          String      @id @default(cuid())
  code        String      @unique
  name        String
  scope       AccessScope @default(SYSTEM_ADMIN)
  description String?
  isSystem    Boolean     @default(false)
  isActive    Boolean     @default(true)

  version   Int       @default(1)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  roleMenus       AccessRoleMenu[]
  rolePermissions AccessRolePermission[]
  userRoles       UserAccessRole[]

  @@index([scope, isActive])
  @@map("access_roles")
}

model AccessMenu {
  id           String      @id @default(cuid())
  code         String      @unique
  label        String
  scope        AccessScope @default(SYSTEM_ADMIN)
  routePattern String
  sortOrder    Int         @default(0)
  iconKey      String?
  isVisible    Boolean     @default(true)
  isActive     Boolean     @default(true)

  version   Int       @default(1)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  roleMenus AccessRoleMenu[]

  @@index([scope, isActive, sortOrder])
  @@map("access_menus")
}

model AccessPermission {
  id          String      @id @default(cuid())
  code        String      @unique
  moduleCode  String
  action      String
  description String?
  scope       AccessScope @default(SYSTEM_ADMIN)
  isActive    Boolean     @default(true)

  version   Int       @default(1)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  rolePermissions AccessRolePermission[]

  @@index([scope, moduleCode, isActive])
  @@map("access_permissions")
}

model AccessRoleMenu {
  id        String @id @default(cuid())
  roleId    String
  menuId    String
  isEnabled Boolean @default(true)

  version   Int       @default(1)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  role AccessRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  menu AccessMenu @relation(fields: [menuId], references: [id], onDelete: Cascade)

  @@unique([roleId, menuId])
  @@index([roleId])
  @@index([menuId])
  @@map("access_role_menus")
}

model AccessRolePermission {
  id           String @id @default(cuid())
  roleId       String
  permissionId String
  isEnabled    Boolean @default(true)

  version   Int       @default(1)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  role       AccessRole       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission AccessPermission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("access_role_permissions")
}

model UserAccessRole {
  id     String @id @default(cuid())
  userId String
  roleId String

  version   Int       @default(1)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  user User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  role AccessRole @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_access_roles")
}
```

### Suggested `User` relation addition

```prisma
model User {
  // ...existing fields
  accessRoles UserAccessRole[]
}
```

## 2. API Contract Draft

Base route: `/api/admin/settings`

### Menus

- `GET /menus`
- `POST /menus`
- `GET /menus/:id`
- `PATCH /menus/:id`
- `PATCH /menus/:id/archive`
- `PATCH /menus/:id/restore`

### Roles

- `GET /roles`
- `POST /roles`
- `GET /roles/:id`
- `PATCH /roles/:id`
- `PATCH /roles/:id/archive`
- `PATCH /roles/:id/restore`

### Role Access Mapping

- `GET /roles/:id/access`
- `PUT /roles/:id/access/menus`
- `PUT /roles/:id/access/permissions`

## 3. Request/Response Shapes

### `POST /menus` request

```json
{
  "code": "ADMIN_SETTINGS_MENUS",
  "label": "Menus",
  "scope": "SYSTEM_ADMIN",
  "routePattern": "/dashboard/settings/menus",
  "sortOrder": 120,
  "iconKey": "MenuSquare",
  "isVisible": true
}
```

### `POST /roles` request

```json
{
  "code": "OPS_MANAGER",
  "name": "Operations Manager",
  "scope": "SYSTEM_ADMIN",
  "description": "Can manage landlords, plans, and subscriptions",
  "isSystem": false,
  "isActive": true
}
```

### `PUT /roles/:id/access/menus` request

```json
{
  "menuCodes": [
    "ADMIN_DASHBOARD",
    "ADMIN_PROPERTY_GROUPS",
    "ADMIN_SETTINGS_MENUS",
    "ADMIN_SETTINGS_ROLES"
  ]
}
```

### `PUT /roles/:id/access/permissions` request

```json
{
  "permissionCodes": [
    "ROLE_VIEW",
    "ROLE_CREATE",
    "ROLE_UPDATE",
    "MENU_VIEW",
    "MENU_UPDATE"
  ]
}
```

### `GET /roles/:id/access` response

```json
{
  "role": {
    "id": "role_123",
    "code": "OPS_MANAGER",
    "name": "Operations Manager",
    "scope": "SYSTEM_ADMIN"
  },
  "menus": ["ADMIN_DASHBOARD", "ADMIN_SETTINGS_MENUS"],
  "permissions": ["ROLE_VIEW", "ROLE_UPDATE"]
}
```

## 4. Important Guardrail Recommendations

- Keep `code` immutable after creation.
- Soft-delete only; avoid hard delete in runtime tables.
- Disallow archiving roles/menus tagged `isSystem=true`.
- Enforce optimistic lock (`version`) on update APIs.
- Always write audit entries for access mapping changes.

## 5. Scope Guidance

- Recommended now: enable dynamic role/menu for `SYSTEM_ADMIN` users only.
- Keep landlord access policy as existing org-role + subscription-entitlement model.
- Add landlord dynamic RBAC only when there is confirmed need for per-org custom policy editing.
