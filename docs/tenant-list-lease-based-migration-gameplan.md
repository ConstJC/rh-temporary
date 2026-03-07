# Tenant List (Landlord) — Lease-Based Migration Gameplan

## Goal
Migrate landlord tenant listing to be **lease-driven** and remove dependency on `tenant.propertyGroupId`.

Requested direction:
- Tenant list per landlord should come from `Lease` records.
- Update Prisma schema and seed.
- Remove `tenant.propertyGroupId` usage across backend/frontend.
- Add/keep lease-level fields needed for landlord scoping (`propertyGroupId`, `propertyId`, `unitId`).

---

## Current State (Observed)

### Prisma
- `Tenant` currently has `propertyGroupId` and relation to `PropertyGroup`.
- `Lease` has `tenantId`, `unitId` (already present), but no direct `propertyGroupId`/`propertyId`.
- `Payment` currently derives `propertyGroupId` from `lease.tenant.propertyGroupId` in several services.

### Backend usage hotspots
- `backend/src/tenants/tenants.service.ts` uses `tenant.propertyGroupId` for list/filter.
- `backend/src/leases/leases.service.ts` uses `tenant.propertyGroupId` in create/find/access checks.
- `backend/src/payments/payments.service.ts` uses `lease.tenant.propertyGroupId` for payment rows.

### Frontend usage hotspots
- Tenant list: `frontend/app/(landlord)/[pgId]/tenants/page.tsx`
- Tenant API hook: `frontend/src/lib/api/landlord.api.ts`, `frontend/src/features/landlord/hooks/useTenants.ts`
- Tenant type shape: `frontend/src/types/domain.types.ts`

---

## Target Data Model (Per Request)

### Tenant
- Remove `propertyGroupId` column and relation from `Tenant`.
- Tenant becomes org-agnostic profile row.

### Lease
- Keep `unitId` (already exists).
- Add:
  - `propertyId` (FK to `Property`)
  - `propertyGroupId` (FK to `PropertyGroup`)
- Keep `tenantId` as-is.

### Invariants
- `lease.propertyId` must match `lease.unit.propertyId`.
- `lease.propertyGroupId` must match `lease.property.propertyGroupId`.
- All landlord tenant listing/query scope must use `lease.propertyGroupId = :pgId`.

---

## Migration Strategy (Expand → Backfill → Switch → Contract)

## Phase 1: Expand Schema (Non-breaking)
1. Update Prisma schema:
   - Add `Lease.propertyId` + relation/index.
   - Add `Lease.propertyGroupId` + relation/index.
   - Keep `Tenant.propertyGroupId` temporarily.
2. Create and run migration.
3. Regenerate Prisma client.

Deliverables:
- `backend/prisma/schema.prisma`
- new migration SQL
- generated client update

## Phase 2: Backfill Existing Data
1. Backfill lease fields from existing joins:
   - `lease.propertyId = lease.unit.propertyId`
   - `lease.propertyGroupId = lease.unit.property.propertyGroupId`
2. Validate no nulls and referential consistency.
3. Add DB constraints (`NOT NULL`) only after successful backfill.

Validation queries:
- count leases with null `propertyId`/`propertyGroupId`
- count mismatches between lease fields and unit/property join

## Phase 3: Backend Switch to Lease-Based Scope
1. Update `LeasesService`:
   - write `propertyId`/`propertyGroupId` during lease create.
   - use `lease.propertyGroupId` for scope checks.
2. Update `PaymentsService`:
   - derive payment `propertyGroupId` from `lease.propertyGroupId`.
3. Update `TenantsService.findAll`:
   - list from `Lease` scoped by `lease.propertyGroupId`.
   - dedupe by tenant (ACTIVE preferred, else latest lease).
4. Audit all `tenant.propertyGroupId` references and replace.

Key files:
- `backend/src/tenants/tenants.service.ts`
- `backend/src/leases/leases.service.ts`
- `backend/src/payments/payments.service.ts`

## Phase 4: Frontend Contract Update
1. Update tenant list table columns for lease-based rows:
   - `Tenant`
   - `Contact`
   - `Status`
   - `Property`
   - `Unit`
   - `Lease Status` (recommended)
   - `Actions`
2. Remove any property-group-id assumptions from tenant list UI state/search/sort.
3. Keep row actions routing by `tenantId`/`leaseId` depending feature.

Key files:
- `frontend/app/(landlord)/[pgId]/tenants/page.tsx`
- `frontend/src/lib/api/landlord.api.ts`
- `frontend/src/features/landlord/hooks/useTenants.ts`
- `frontend/src/types/domain.types.ts`

## Phase 5: Seed and Fixtures Update
1. Update `backend/prisma/seed.ts`:
   - stop writing `tenant.propertyGroupId`.
   - ensure leases write `propertyId` + `propertyGroupId`.
2. Update any fixture assumptions in tests/docs.

## Phase 6: Contract (Destructive Cleanup)
1. Remove `Tenant.propertyGroupId` column and relation from Prisma schema.
2. Create destructive migration.
3. Regenerate Prisma client.
4. Re-run build/tests and smoke-check landlord flows.

---

## Risks and Mitigations

### Risk 1: Tenant creation before lease
- With `tenant.propertyGroupId` removed, newly created tenant is not scoped until leased.
- Mitigation:
  - Decide product rule:
    - A) Allow org-agnostic tenants (current requested model), or
    - B) Keep `tenant.propertyGroupId` nullable for draft tenants.

### Risk 2: Data drift in denormalized lease fields
- `Lease.propertyId/propertyGroupId` duplicate derivable data from `unit`.
- Mitigation:
  - Set once at creation and treat immutable.
  - Add consistency checks in service-level writes.

### Risk 3: Breaking existing queries
- Any remaining `tenant.propertyGroupId` usage will break post-drop.
- Mitigation:
  - mandatory grep sweep before contract phase.
  - staged rollout with feature branch validation.

---

## Acceptance Criteria
1. Landlord tenant list uses leases as source of truth.
2. Tenant list no longer relies on `tenant.propertyGroupId`.
3. Lease rows contain `propertyGroupId`, `propertyId`, `unitId` consistently.
4. Payments and lease access checks use lease-scoped `propertyGroupId`.
5. Prisma migration + seed + backend + frontend compile/lint/build all pass.
6. Tenant page, lease page, payment page work with no forbidden regressions.

---

## Suggested Execution Order
1. Phase 1 + 2 (schema expand + backfill)
2. Phase 3 (backend switch)
3. Phase 4 (frontend table/API contract)
4. Phase 5 (seed)
5. Phase 6 (drop tenant property group column)

