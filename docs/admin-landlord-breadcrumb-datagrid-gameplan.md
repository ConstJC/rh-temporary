# Admin + Landlord Pages UI Gameplan

Date: March 10, 2026
Scope: `frontend/app/(admin)/*` and `frontend/app/(landlord)/[pgId]/*`

## Goal
1. Add breadcrumb navigation on every System Admin and Landlord page.
2. Center-align all `Actions` columns in table/datagrid views.
3. Add a Property Group numeric ID for table usage while keeping formatted code (`PG-001`) for display contexts.

## Product Decision (Property Group ID)
Recommendation: keep existing string PK (`property_groups.id` as `cuid`) for relations, and add a separate incremental integer for business display/order.

- Keep: `property_groups.id` (string, internal PK/FK)
- Add: `property_groups.pgNumber` (integer, unique, sequence-backed)
- Derived display code: `PG-${pgNumber.toString().padStart(3, '0')}`
- Table requirement: show `pgNumber` as plain integer (example: `1`, `2`, `3`)
- Detail/header/breadcrumb requirement: show formatted code (example: `PG-001`)

Why this is the safest approach:
- No FK breakage across existing tables using string IDs.
- Gives clean sortable IDs in datagrids.
- Keeps branded human-readable code for UI contexts.

## Shared Implementation Standards

### Breadcrumb
- Add a reusable component: `frontend/src/components/common/AppBreadcrumb.tsx`
- Support dynamic segments:
  - Admin: static label chain
  - Landlord: include active property group name/code and entity label (Property, Tenant, Lease, Payment)
- Place breadcrumb directly above `PageHeader` in each page.

### Actions Column Alignment
- Target style for all table/datagrid `Actions` headers and cells:
  - Header: `text-center`
  - Cell wrapper: `flex items-center justify-center gap-2`
- `DataTable`-based pages: support per-column alignment via column meta/class.
- Native `<Table>` pages: update `<TableHead>` and `<TableCell>` class names to center for actions.

### Property Group ID Contract
- Backend/API should return all 3 values where relevant:
  - `id` (cuid)
  - `pgNumber` (int)
  - `pgCode` (formatted `PG-001`, can be derived server-side)
- Frontend list tables use `pgNumber` column label: `Property Group ID`
- Frontend details/breadcrumb chips can show `pgCode`

## Page-by-Page Gameplan

## System Admin Pages

| Route | Breadcrumb | Table/Datagrid Work | Notes |
|---|---|---|---|
| `/dashboard` | Add `Home / Dashboard` | Dashboard has recent signups table; center actions if actions are added later | KPI page |
| `/dashboard/property-groups` | Add `Home / Property Groups` | Add `Property Group ID` (`pgNumber`) column; center `Actions` | Uses `LandlordsTable` |
| `/dashboard/landlords` | Add `Home / Landlords` | Same as above if route retained; center `Actions` | Also uses `LandlordsTable` |
| `/dashboard/users` | Add `Home / Users` | Center `Actions` | `UsersTable` |
| `/dashboard/subscriptions` | Add `Home / Subscriptions` | Center `Actions` | `SubscriptionsTable` |
| `/dashboard/subscription-plans` | Add `Home / Subscription Plans` | Center `Actions` | `SubscriptionPlansTable` |
| `/dashboard/addons` | Add `Home / Add-on Catalog` | Center `Actions` in custom HTML table | `AddonCatalogTable` |
| `/dashboard/audit` | Add `Home / Audit Trail` | No action buttons now; keep column alignment standards ready | `AuditLogTable` |
| `/dashboard/reports` | Add `Home / Reports` | No table yet | Placeholder page |
| `/dashboard/profile` | Add `Home / My Profile` | No table | Profile page |
| `/dashboard/settings` | Add `Home / Settings` | No table | Settings hub |
| `/dashboard/settings/roles` | Add `Home / Settings / Roles` | No table currently | Placeholder |
| `/dashboard/settings/menus` | Add `Home / Settings / Menus` | No table currently | Placeholder |
| `/landlords` | Add breadcrumb or redirect to `/dashboard/landlords` | N/A | Legacy route |
| `/subscriptions` | Add breadcrumb or redirect to `/dashboard/subscriptions` | N/A | Legacy route |
| `/settings` | Add breadcrumb or redirect to `/dashboard/settings` | N/A | Legacy route |

## Landlord Pages

| Route | Breadcrumb | Table/Datagrid Work | Notes |
|---|---|---|---|
| `/:pgId/overview` | Add `Home / Overview` (+ org chip with `pgCode`) | No table changes | Dashboard |
| `/:pgId/properties` | Add `Home / Properties` | Card layout only currently | No actions table |
| `/:pgId/properties/new` | Add `Home / Properties / Add Property` | No table | Form page |
| `/:pgId/properties/:propertyId` | Add `Home / Properties / Property Details` | Units table: change `Action` header/cell to centered | Existing table has right-aligned action |
| `/:pgId/properties/:propertyId/units/new` | Add `Home / Properties / Property Details / Add Unit` | No table | Form page |
| `/:pgId/units/:unitId` | Add `Home / Units / Unit Details` | No table | Detail page |
| `/:pgId/tenants` | Add `Home / Tenants` | Center `Actions` header/cell | Existing table right-aligned |
| `/:pgId/tenants/new` | Add `Home / Tenants / Add Tenant` | No table | Form page |
| `/:pgId/tenants/:tenantId` | Add `Home / Tenants / Tenant Details` | No table | Detail page |
| `/:pgId/leases` | Add `Home / Leases` | Center `Actions` header/cell | Existing table right-aligned |
| `/:pgId/leases/new` | Add `Home / Leases / Create Lease` | No table | Form page |
| `/:pgId/leases/:leaseId` | Add `Home / Leases / Lease Details` | Payment history table: center `Actions` column | Detail sub-table |
| `/:pgId/payments` | Add `Home / Payments` | Center `Actions` header/cell | Existing table right-aligned |
| `/:pgId/payments/:paymentId` | Add `Home / Payments / Payment Details` | No table | Detail page |
| `/:pgId/payments/:paymentId/record` | Add `Home / Payments / Record Payment` | No table | Form page |
| `/:pgId/addons` | Add `Home / Add-ons` | No table yet | Placeholder |
| `/:pgId/utilities` | Add `Home / Utilities` | No table yet | Placeholder |
| `/:pgId/reports` | Add `Home / Reports` | No table yet | Placeholder |
| `/:pgId/subscription` | Add `Home / Subscription` | No table yet | Placeholder |
| `/:pgId/settings` | Add `Home / Settings` | No table yet | Placeholder |

## Technical Work Breakdown

## 1) Frontend (UI)
- [ ] Create `AppBreadcrumb` component and lightweight config helper (`admin + landlord` route maps).
- [ ] Add breadcrumb block in all admin pages under `app/(admin)/*`.
- [ ] Add breadcrumb block in all landlord pages under `app/(landlord)/[pgId]/*`.
- [ ] Update `DataTable` to support alignment metadata for headers/cells.
- [ ] Update admin table column definitions to center `Actions` column.
- [ ] Update landlord native tables (`tenants`, `leases`, `payments`, `property detail units`, `lease detail payments`) to center `Actions` column.

## 2) Backend + DB (Property Group ID)
- [ ] Prisma schema update: add `pgNumber Int @unique` to `PropertyGroup`.
- [ ] DB migration: backfill existing rows with sequence-generated values.
- [ ] On create property group: assign `pgNumber` from DB sequence.
- [ ] API DTO/serializer: expose `pgNumber` and `pgCode` in admin + landlord property group responses.
- [ ] Keep all existing relations/scopes using `id` (string `cuid`).

## 3) Admin Table Update for Property Group ID
- [ ] Add `Property Group ID` integer column to `LandlordsTableColumns` before org name.
- [ ] Ensure sorting works numerically on `pgNumber`.
- [ ] Keep optional formatted code (`PG-001`) for detail chips/slideovers only.

## Definition of Done
- Every System Admin and Landlord page renders a breadcrumb.
- Every table/datagrid action column is centered (header + cell content).
- Property group list table shows integer `Property Group ID`.
- UI still supports friendly formatted ID (`PG-001`) where needed.
- Core FK/scoping logic remains on string `id` with zero regression.
