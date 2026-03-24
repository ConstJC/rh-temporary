# RentHub Gameplan: Admin Settings for Roles and Menus

**Date:** 2026-03-19  
**Owner:** Platform Admin + Backend + Frontend  
**Status:** Proposed

## 1. Objective

Build an Admin Settings area with two modules under sidebar `Settings`:

1. `Menus` — add, view, edit, soft delete menu items
2. `Roles` — add, view, edit, soft delete roles, and map role access to menus/permissions

Goal: make platform administration configurable without hardcoding role-menu rules in code.

## 2. Business Decision Summary

### 2.1 Is this efficient and recommended?

Yes, **for System Admin scope** it is efficient and recommended when:

- your menu list and access policies change regularly
- multiple admin personas exist (Support, Operations, Finance, Auditor, etc.)
- you want auditability and no redeploy for every access change

It is **not recommended** to make everything fully dynamic from day 1 for all user types if requirements are still simple. Start with controlled flexibility.

### 2.2 Is this only for platform users?

Recommended split:

- **System Admin users:** use dynamic Roles + Menus + Permissions from this module
- **Landlord users:** keep access as combined policy:
  - `Org Role` (OWNER/ADMIN/STAFF action-level limits)
  - `Subscription Plan Entitlements` (which modules/features are available)

So landlord access should remain: `role allows action` AND `plan includes module/permission`.

## 3. Target Access Model

Use layered access checks:

1. Authentication (JWT)
2. User type guard (`SYSTEM_ADMIN` vs `LANDLORD`)
3. Membership/role guard (for landlord org context)
4. Menu-level access guard (route/module)
5. Permission-level access guard (action)
6. Subscription entitlement guard (landlord only)

## 4. Functional Requirements

## 4.1 Menus Module (`/dashboard/settings/menus`)

- List menu items with status (`ACTIVE` / `ARCHIVED`)
- Add menu item
- View details
- Edit menu item
- Soft delete menu item (`deletedAt` or `isActive=false`)
- Restore archived menu item (optional but recommended)

Fields:

- `code` (unique, immutable once used)
- `label`
- `scope` (`SYSTEM_ADMIN`, `LANDLORD`, `BOTH`)
- `routePattern`
- `sortOrder`
- `iconKey` (optional)
- `isVisible` (optional toggle)

## 4.2 Roles Module (`/dashboard/settings/roles`)

- List roles with status
- Add role
- View role details
- Edit role
- Soft delete role
- Assign menu access per role
- Assign permission access per role

Fields:

- `code` (unique)
- `name`
- `scope` (`SYSTEM_ADMIN`, `LANDLORD`, `BOTH`)
- `description`
- `isSystem` (non-deletable seed roles)
- `isActive`

## 5. Data Model Proposal

## 5.1 New/Updated Tables

1. `AccessRole`
- `id`, `code`, `name`, `scope`, `description`, `isSystem`, `isActive`, timestamps, `deletedAt`

2. `AccessMenu`
- `id`, `code`, `label`, `scope`, `routePattern`, `sortOrder`, `iconKey`, `isVisible`, timestamps, `deletedAt`

3. `AccessPermission`
- `id`, `code`, `moduleCode`, `action`, `description`, `scope`, `isActive`, timestamps, `deletedAt`

4. `AccessRoleMenu`
- `roleId`, `menuId`, `isEnabled`
- unique `(roleId, menuId)`

5. `AccessRolePermission`
- `roleId`, `permissionId`, `isEnabled`
- unique `(roleId, permissionId)`

## 5.2 Soft Delete Rules

- Never hard-delete roles/menus that have existing assignments
- Soft delete by setting `deletedAt`
- Exclude archived records from default queries
- Keep restore endpoint for operational mistakes

## 6. API Plan

## 6.1 Menus API

- `GET /admin/settings/menus`
- `POST /admin/settings/menus`
- `GET /admin/settings/menus/:id`
- `PATCH /admin/settings/menus/:id`
- `PATCH /admin/settings/menus/:id/archive`
- `PATCH /admin/settings/menus/:id/restore` (recommended)

## 6.2 Roles API

- `GET /admin/settings/roles`
- `POST /admin/settings/roles`
- `GET /admin/settings/roles/:id`
- `PATCH /admin/settings/roles/:id`
- `PATCH /admin/settings/roles/:id/archive`
- `PATCH /admin/settings/roles/:id/restore` (recommended)

## 6.3 Assignment API

- `GET /admin/settings/roles/:id/access`
- `PUT /admin/settings/roles/:id/access/menus`
- `PUT /admin/settings/roles/:id/access/permissions`

## 7. Frontend UI Plan

## 7.1 Sidebar

Under `Settings`, include:

- `Roles`
- `Menus`

## 7.2 Menus Page

- Search/filter (`scope`, `status`)
- Data table
- Create/Edit slide-over form
- Archive/Restore confirm dialogs

## 7.3 Roles Page

- Search/filter (`scope`, `status`)
- Data table
- Create/Edit slide-over form
- Access matrix panel:
  - menu checklist
  - permission checklist (grouped by module)

## 8. Validation and Guardrails

- `code` fields immutable after creation (or tightly controlled)
- Prevent archiving/deleting system-critical menus/roles
- Prevent duplicate menu `routePattern` collisions per scope
- Prevent role assignment to archived menus/permissions
- Enforce optimistic locking (`version`) for concurrent admin edits

## 9. Audit and Observability

Capture audit entries for:

- role created/updated/archived/restored
- menu created/updated/archived/restored
- role-menu mappings changed
- role-permission mappings changed

Structured logs for denied access should include:

- `userId`, `userType`, `roleCode`, `menuCode`, `permissionCode`, `scope`

## 10. Recommended Implementation Strategy

1. Phase 1: Data model + seed baseline menus/roles/permissions
2. Phase 2: Read-only admin screens for roles/menus
3. Phase 3: Enable create/edit/archive for menus
4. Phase 4: Enable create/edit/archive for roles
5. Phase 5: Enable role access assignment UI + backend guards
6. Phase 6: Roll out to production with feature flag

## 11. Key Recommendation for Your Current Product Stage

Given your current architecture (subscription-based landlord access):

- Implement this **first for System Admin portal only**
- Keep landlord access policy as:
  - org role responsibility checks
  - subscription plan entitlement checks
- Add custom landlord role-menu management later only if there is a clear business need for tenant/org-level custom RBAC

This keeps complexity manageable while still giving the platform team powerful admin control.

## 12. Acceptance Criteria

- Admin can create, edit, view, and soft delete menus
- Admin can create, edit, view, and soft delete roles
- Admin can assign menu and permission access to roles
- Guard checks enforce role-menu-permission access in admin routes/APIs
- Archived roles/menus are not active in runtime access decisions
- Audit trail captures all role/menu/access policy changes
