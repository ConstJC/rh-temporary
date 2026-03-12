# Tenant + Leases Consolidation Gameplan

## Goal
Consolidate tenant-related workflows under the lease module, reduce navigation complexity, and fix lease creation blockers.

## Menu Naming Decision
Use **Tenant Leases** as the menu label.

Rationale:
- `Leases` alone is generic.
- `Tenant Leases` clearly signals this is where tenant occupancy contracts are managed.
- Keeps wording simple for landlord users.

## Requested Changes
1. Remove `Tenants` from landlord sidebar navigation.
2. Rename `Leases` menu label to `Tenant Leases`.
3. Keep tenant operations accessible from lease workflows.
4. Fix lease creation issues and improve validation.

## Implemented Changes
1. Frontend navigation
- Removed landlord sidebar item: `/:pgId/tenants`.
- Renamed landlord sidebar item: `Leases` -> `Tenant Leases`.
- Updated landlord breadcrumb label for `leases` to `Tenant Leases`.

2. Lease list (`/:pgId/leases`)
- Updated page title/description to reflect `Tenant Leases`.
- Added quick action button: `Add Tenant`.
- Kept `Create Lease` action.
- Added direct click-through from tenant name to tenant detail page.

3. Lease creation (`/:pgId/leases/new`)
- Added **Quick Add Tenant** section directly inside lease setup flow.
- Supports tenant creation with required: first name, last name, phone.
- Keeps email optional.
- Newly created tenant is immediately selectable for lease creation.
- Added tenant eligibility filtering:
  - exclude `BLACKLISTED` tenants
  - exclude tenants with an existing `ACTIVE` lease
- Added strict client-side numeric validation for:
  - billing day (1-28)
  - advance months (>= 0, whole number)
  - grace period days (>= 0, whole number)

4. Backend lease safeguards
- Block creating a lease if tenant already has an `ACTIVE` lease.
- On new lease creation, set tenant status to `ACTIVE`.

## Efficient Lease Creation Model (Recommended)
1. Use `tenantId` as the canonical lease link key.
2. Do **not** use email as the required lease key.
3. Keep email optional and use it for communication/invite flows only.
4. Require minimal identity fields for fast onboarding:
- first name
- last name
- phone
- email optional
5. Add optional duplicate checks by normalized email/phone when provided.

## Why Email Should Be Optional
- Some tenants may not have reliable email access.
- Lease operations should not block occupancy onboarding.
- Internal IDs (`tenantId`) are stable and avoid identity drift.

## Next Technical Step (Optional)
Add backend support to list newly created tenants in landlord tenant queries even before first lease, to avoid lease-derived visibility limitations.
