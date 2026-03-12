# Tenant + Lease Logic Gameplan (Landlord Owner + System Admin)

Date: March 12, 2026  
Scope: Tenant creation, tenant linking to lease, `PropertyGroupId` ownership assignment, and account setup onboarding

## Requested Direction
1. Every tenant should eventually have a `PropertyGroupId`.
2. Landlord Owner can create tenant records from landlord portal.
3. Landlord-created tenant should also create a `Users` row with `userType = TENANT` and `role = USER`.
4. After landlord creates tenant, system sends account setup email to tenant.
5. Tenant created from mobile portal starts with `PropertyGroupId = null`.
6. Mobile tenant is assigned to a property group only through landlord lease invitation and tenant acceptance.
7. `PropertyGroupId` may stay `null` for future `Explore` module application flow until tenant is matched/accepted.

## Efficiency and Scalability Assessment

### Verdict
This is efficient for a single-primary-property-group model and will scale well for most early and mid-stage workloads if indexed correctly.

### Efficient and scalable when these assumptions are true
1. A tenant belongs to one active property group at a time.
2. Cross-property-group concurrent tenancy is not a hard requirement.
3. Property-group assignment changes are relatively infrequent.

### Risks to watch
1. A single `Tenant.PropertyGroupId` becomes limiting if tenant must belong to multiple landlords/property groups at the same time.
2. Reassigning `PropertyGroupId` can hide historical affiliation unless history is tracked.
3. Email/phone uniqueness conflicts can appear if dedupe rules are weak.

### Recommendation
1. Proceed now with `Tenant.PropertyGroupId` as requested.
2. Keep lease as operational source of truth for access and billing.
3. Add tenant-property-group history logging from day one.
4. Plan a future `TenantPropertyGroup` mapping table only if multi-group tenancy becomes a product requirement.

## Data Model Recommendations

### Tenant table
- `id`
- `userId` (FK -> `Users.id`)
- `email` (normalized, unique)
- `phoneNumber` (normalized, unique when present)
- `PropertyGroupId` (nullable FK -> `PropertyGroup.id`)
- `registrationSource` (`LANDLORD_PORTAL`, `MOBILE_PORTAL`, `EXPLORE`)
- `emailVerifiedAt` (nullable)
- `accountSetupStatus` (`PENDING`, `COMPLETED`, `EXPIRED`)
- `createdAt`, `updatedAt`

### Users table
- `id`
- `email` (unique)
- `passwordHash` (nullable until setup complete)
- `userType` (`TENANT`)
- `role` (`USER`)
- `status` (`INVITED`, `ACTIVE`, `SUSPENDED`)
- `createdAt`, `updatedAt`

### Lease table
- Keep `propertyGroupId`, `propertyId`, `unitId`, `tenantId`, status lifecycle fields.
- Use lease status for occupancy and payment workflows.

## Creation of Tenant (Landlord Portal)

### Flow
1. Landlord opens `/:pgId/tenants/new`.
2. Landlord submits tenant details (name, email required, phone optional).
3. Backend normalizes email/phone and checks duplicates.
4. If tenant already exists:
   - Return existing tenant info.
   - If existing tenant has `PropertyGroupId = null`, allow lease-invite flow to assign later.
   - If existing tenant has same `PropertyGroupId`, continue normal lease flow.
   - If existing tenant has different `PropertyGroupId`, block and require admin decision/reassignment policy.
5. If tenant does not exist:
   - Insert `Users` row with `userType = TENANT`, `role = USER`, `status = INVITED`.
   - Insert `Tenant` row linked to user and set `PropertyGroupId = :pgId`.
   - Set `registrationSource = LANDLORD_PORTAL`.
   - Set `accountSetupStatus = PENDING`.
6. Send account setup email with secure token and expiration.
7. Tenant completes account setup and email verification.
8. Update user/tenant status to active/completed.

### Transaction rule
Create `Users` + `Tenant` + invite token in one DB transaction to avoid partial records.

## Mobile Tenant Already Exists (`PropertyGroupId = null`)

### Flow
1. Landlord creates lease draft and enters tenant email or phone (must be unique key).
2. Backend finds tenant by normalized email/phone.
3. If tenant exists and `PropertyGroupId = null`:
   - Create lease invitation and send email.
   - Keep lease status `PENDING_TENANT_ACCEPTANCE`.
4. Tenant accepts invitation from email.
5. In one transaction:
   - Link lease to tenant (if not already linked).
   - Update tenant `PropertyGroupId = lease.propertyGroupId`.
   - Mark invitation accepted.
   - Advance lease status based on policy (`ACTIVE` or `PENDING_SIGNATURE`).

### Guardrails
1. Do not assign `PropertyGroupId` until invitation is accepted.
2. Reject invite acceptance if token expired/revoked.
3. Reject if tenant already tied to a different property group and reassignment policy is disabled.

## `PropertyGroupId` Null Rules
1. Allowed only when:
   - `registrationSource = MOBILE_PORTAL` and tenant not yet accepted into a lease, or
   - `registrationSource = EXPLORE` (future enhancement) and no accepted lease yet.
2. Not allowed for landlord-created tenants.
3. Once lease invitation is accepted, `PropertyGroupId` should become non-null.

## Access Control

| Action | System Admin | Landlord Owner |
|---|---|---|
| View all tenants | Yes | No |
| Create tenant record | Yes | Yes |
| Auto-create `Users` row for tenant | Yes | Yes |
| Send setup invite email | Yes | Yes |
| Create lease invite for mobile tenant | Yes | Yes (own `:pgId` only) |
| Update tenant `PropertyGroupId` on invite acceptance | Yes | System-driven only |

## API Contract Recommendations
1. `POST /landlord/:pgId/tenants`
   - Creates tenant + users row when not found.
   - Sends account setup email.
2. `POST /landlord/:pgId/tenants/:tenantId/resend-setup`
   - Re-sends setup email if still pending.
3. `POST /landlord/:pgId/leases/draft`
   - Creates draft lease.
4. `POST /landlord/:pgId/leases/:leaseId/invite-tenant`
   - Input: email or phone.
   - Sends invite to matching tenant.
5. `POST /tenant/lease-invites/:token/accept`
   - Accepts invite and assigns `Tenant.PropertyGroupId` if null.

## Required Indexes and Constraints
1. Unique index on normalized tenant email.
2. Unique index on normalized tenant phone when present.
3. Index on `Tenant.PropertyGroupId`.
4. Index on `Lease.propertyGroupId` + `Lease.status`.
5. Foreign key constraints on `Tenant.userId` and `Tenant.PropertyGroupId`.

## Audit Requirements
1. Log landlord who created tenant.
2. Log setup invite send/resend and acceptance.
3. Log lease invitation send and acceptance.
4. Log every `PropertyGroupId` change with old/new values and actor/system reason.

## Definition of Done
1. Landlord can create tenant and system auto-creates `Users` row (`TENANT`, `USER`).
2. Landlord-created tenant gets `PropertyGroupId = landlord :pgId` immediately.
3. Setup email is sent after landlord tenant creation.
4. Mobile tenant with `PropertyGroupId = null` can be assigned through lease invite acceptance.
5. System Admin can still view all registered tenants.
6. All critical actions are audited.
