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
5. During landlord tenant creation, also create a linked `User` record for the tenant.
6. Make tenant email required for landlord-created tenants.
7. Send an email notification to the tenant confirming the account was created by the landlord.
8. Include an optional `Set up tenant account` link in that email (and optionally show the same link in UI confirmation).

## Implemented Changes + Added Requirement
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
- Supports tenant creation with required: first name, last name, phone, email.
- Newly created tenant is immediately selectable for lease creation.
- Added tenant eligibility filtering:
  - exclude `BLACKLISTED` tenants
  - exclude tenants with an existing `ACTIVE` lease
- Added strict client-side numeric validation for:
  - billing day (1-28)
  - advance months (>= 0, whole number)
  - grace period days (>= 0, whole number)

4. Tenant account provisioning during tenant creation (new requirement)
- Pending implementation in backend + email service.
- When landlord creates a tenant, backend should also insert a linked row in `User`.
- Provision a temporary default password (system-generated) and force password reset on first login.
- Require email at creation time so notification can be sent.
- Send email copy stating the tenant account was created by the landlord.
- Add optional CTA link: `Set up tenant account` (tokenized onboarding/reset link).

5. Backend lease safeguards
- Block creating a lease if tenant already has an `ACTIVE` lease.
- On new lease creation, set tenant status to `ACTIVE`.

## Efficient Lease Creation Model (Recommended)
1. Use `tenantId` as the canonical lease link key.
2. Do **not** use email as the required lease key.
3. Require email for landlord-created tenants to support account provisioning and notifications.
4. Require minimal identity fields for fast onboarding:
- first name
- last name
- phone
- email required
5. Add duplicate checks by normalized email/phone at tenant creation time.

## Why Email Is Required (Updated Direction)
- Tenant login account is now created during landlord tenant creation.
- Notification and onboarding flow depends on a valid tenant email.
- Email enables secure first-time account setup via tokenized link.
- Internal IDs (`tenantId`) remain the canonical lease linkage key.

## Next Technical Step (Optional)
Add onboarding endpoints/services for tenant account setup links:
- generate signed setup token
- send landlord-created account notification email
- verify token and force password update
