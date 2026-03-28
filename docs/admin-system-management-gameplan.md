# System Admin Implementation Gameplan

## Goal
Implement system admin capabilities so admins can:
1. create/add users,
2. create/add property groups,
3. manage data using a consistent Shadcn-style DataTable UI across admin tables.

## Scope
- **In scope**
  - Admin backend APIs for creating users and property groups.
  - Admin frontend forms and actions for create flows.
  - Data validation, audit trail, and role guard enforcement.
  - Standardized DataTable UX across admin tables.
- **Out of scope (for this phase)**
  - Bulk CSV imports.
  - Tenant-side portal changes.
  - Billing automation changes beyond default subscription assignment.

## Current Baseline (from codebase)
- Admin can already list/update users and property groups:
  - `GET /admin/users`, `PATCH /admin/users/:id`
  - `GET /admin/property-groups`, `PATCH /admin/property-groups/:id`
- Admin cannot yet create users or property groups via dedicated admin endpoints.
- Admin table stack already exists (`@tanstack/react-table` + shared `DataTable` wrappers), with some screens previously using custom table markup.

## Target User Flows

### 1) Admin Create User
1. Admin opens **Users** page.
2. Clicks **Add User**.
3. Fills form fields:
   - first name, last name, email, phone (optional), user type (`SYSTEM_ADMIN` or `LANDLORD`), active status.
4. Submits form.
5. System creates user and triggers onboarding flow:
   - either temporary password + reset email,
   - or verify-email/setup-password link.
6. Users table refreshes and new user appears with status badge.

### 2) Admin Create Property Group
1. Admin opens **Landlords/Property Groups** page.
2. Clicks **Add Property Group**.
3. Fills form:
   - group name, timezone, currency,
   - owner selection (existing landlord) **or** quick-create owner.
4. Submits form.
5. System creates property group, owner membership (`OWNER` role), and default subscription assignment.
6. Table refreshes and new group appears.

## Backend Implementation Plan

### A. DTOs and Validation
- Add DTOs in `backend/src/admin/dto/`:
  - `create-admin-user.dto.ts`
  - `create-admin-property-group.dto.ts`
- Validation rules:
  - user email uniqueness + normalization (`trim().toLowerCase()`).
  - disallow creating `TENANT` from system admin panel (if business rule requires).
  - property group name required, timezone/currency defaults.
  - owner must be valid and active when selecting existing user.

### B. Controller Endpoints
- Update `backend/src/admin/admin.controller.ts`:
  - `POST /admin/users`
  - `POST /admin/property-groups`
- Keep existing guards:
  - `JwtAuthGuard`, `RolesGuard`, `UserTypeGuard`
  - `@Roles(UserRole.ADMIN)` + `@UserTypes(UserType.SYSTEM_ADMIN)`

### C. Service Layer
- Update `backend/src/admin/admin.service.ts` with:
  - `createUser(currentUserId, dto)`
  - `createPropertyGroup(currentUserId, dto)`
- Use Prisma transactions for multi-step writes.
- Reuse/create helper logic for:
  - default subscription plan lookup,
  - OWNER role lookup,
  - `PG-XXX` code formatting consistency.

### D. Audit Trail
- Insert `createAuditTrail(...)` records for:
  - user creation (`tableName: 'users'`, action `INSERT`),
  - property group creation (`tableName: 'property_groups'`, action `INSERT`),
  - owner membership link creation (`property_group_members` if tracked separately).

### E. Error Handling
- Return explicit, user-friendly failure reasons:
  - duplicate email,
  - missing default plan,
  - invalid owner,
  - inactive/archived owner account.

### F. Backend Tests
- Add service/controller tests for:
  - successful user creation,
  - duplicate email rejection,
  - successful property group creation with owner,
  - missing OWNER role / plan failures,
  - audit entries created.

## Frontend Implementation Plan

### A. API and Query Hooks
- Update `frontend/src/lib/api/admin.api.ts`:
  - `createUser(payload)`
  - `createPropertyGroup(payload)`
- Add React Query mutations in:
  - `frontend/src/features/admin/hooks/useAdminUsers.ts`
  - `frontend/src/features/admin/hooks/usePropertyGroups.ts`
- Invalidate list keys on success.

### B. Validation Schemas
- Update `frontend/src/lib/validations/admin.schema.ts`:
  - `createAdminUserSchema`
  - `createAdminPropertyGroupSchema`

### C. UI Components
- Add forms/sheets/dialogs:
  - `frontend/src/features/admin/users/CreateUserSheet.tsx`
  - `frontend/src/features/admin/landlords/CreatePropertyGroupSheet.tsx`
- Integrate actions:
  - Users page header gets **Add User** button.
  - Landlords page header gets **Add Property Group** button.

### D. UX Behavior
- Submit button loading state.
- Inline validation feedback.
- Success toast + auto-refresh table.
- Keep filters/pagination state after create.

## DataTable Standardization Plan (Admin)

### Desired UI Pattern
- Row selection checkbox column.
- Consistent sortable headers.
- Footer controls:
  - selected count,
  - rows per page,
  - page indicator,
  - first/prev/next/last buttons.
- Rounded table container and subtle row hover state.

### Rollout Checklist
- [x] `src/components/tables/DataTable.tsx` upgraded to unified Shadcn-style behavior.
- [x] `src/components/tables/DataTablePagination.tsx` updated with richer controls.
- [x] Existing admin tables aligned:
  - Users
  - Landlords
  - Subscriptions
  - Subscription Plans
  - Audit Log
- [x] Custom admin tables converted to shared DataTable:
  - Add-on Catalog
  - Dashboard Recent Signups

## Security and Access Rules
- Only `SYSTEM_ADMIN` can access create endpoints.
- Prevent disabling/deactivating current logged-in admin from create/edit flows where relevant.
- Enforce ownership rules when attaching landlord owner to a property group.
- Preserve immutable audit history for admin actions.

## Delivery Phases

### Phase 1 (Foundation)
- Backend DTOs + endpoints + service methods.
- Frontend API/hook wiring.

### Phase 2 (UI Flows)
- Create user sheet.
- Create property group sheet.
- Success/failure UX polish.

### Phase 3 (Hardening)
- Tests (unit + integration).
- Audit verification.
- Edge-case handling and QA pass.

## Acceptance Criteria
- Admin can create user from UI and see it immediately in Users table.
- Admin can create property group from UI and see it immediately in Property Groups table.
- New records are persisted with correct relationships (owner/member/subscription defaults).
- Every admin table uses shared DataTable and consistent pagination controls.
- Audit trail records are present for all create actions.

## Suggested QA Matrix
- Create `SYSTEM_ADMIN` and `LANDLORD` users.
- Attempt duplicate email.
- Create property group with:
  - existing owner,
  - quick-created owner.
- Verify permissions using non-admin token (must be denied).
- Verify table interactions: sorting, selection, pagination, rows-per-page.
