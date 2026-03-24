# RentHub Gameplan: Menu Access Roles by Subscription Plan

**Date:** 2026-03-17
**Owner:** Backend + Frontend Team
**Status:** Proposed

## 1. Objective

Enhance subscription logic so each subscription plan controls:

1. Feature access (menus/modules)
2. Allowed actions (permissions)
3. Usage limits (properties, units, tenants)

This replaces the current "limits-only" model with a full entitlement model.

## 2. Current State (Codebase Baseline)

- `SubscriptionPlan` currently stores only limits (`propertyLimit`, `unitLimit`, `tenantLimit`) in [schema.prisma](/Users/jayclarkanore/Documents/Practice/bh/backend/prisma/schema.prisma).
- Limit enforcement is implemented in [subscription-limit.helper.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/common/helpers/subscription-limit.helper.ts) and used mainly for create flows.
- Landlord sidebar menus are hardcoded in [Sidebar.tsx](/Users/jayclarkanore/Documents/Practice/bh/frontend/src/components/layout/Sidebar.tsx).
- No backend guard currently blocks module access by subscription plan.
- `OrgRole` (`OWNER`, `ADMIN`, `STAFF`) exists and is enforced separately for org-level responsibilities.

## 3. Target Design

Access becomes **two-dimensional**:

1. **Role-based constraints** (who the member is in the org: OWNER/ADMIN/STAFF)
2. **Plan-based entitlements** (what the org subscription includes)

Effective access = `role allows action` AND `plan includes action/menu`.

## 4. Functional Requirements

### 4.1 System Admin

- Can configure per-plan menu access.
- Can configure per-plan permission access.
- Can modify limits (properties, units total, units per property, tenants).
- Can clone an existing plan to create a new tier quickly.
- Changes should apply to all subscribed property groups immediately (or within cache TTL).

### 4.2 Landlord/Org Member

- Sees only menus included in active plan.
- Cannot access restricted routes even via direct URL.
- Cannot execute restricted API actions even if route is discovered.
- Still sees usage limits and current usage.

## 5. Data Model Changes (Prisma)

### 5.1 New/Updated Fields

Update `SubscriptionPlan` in [schema.prisma](/Users/jayclarkanore/Documents/Practice/bh/backend/prisma/schema.prisma):

- Keep:
  - `propertyLimit`
  - `unitLimit` (treat as org-wide total)
  - `tenantLimit`
- Add:
  - `unitLimitPerProperty Int @default(0)`
  - `accessPolicyVersion Int @default(1)`

### 5.2 New Catalog + Mapping Tables

Add normalized access tables:

1. `FeatureMenu`
   - `id`, `code` (unique), `label`, `routePattern`, `sortOrder`, `isActive`
2. `FeaturePermission`
   - `id`, `code` (unique), `moduleCode`, `action`, `description`, `isActive`
3. `SubscriptionPlanMenu`
   - `subscriptionPlanId`, `menuId`, `isEnabled`
   - unique `(subscriptionPlanId, menuId)`
4. `SubscriptionPlanPermission`
   - `subscriptionPlanId`, `permissionId`, `isEnabled`
   - unique `(subscriptionPlanId, permissionId)`

Reason: this supports admin-managed catalogs and avoids hardcoded access definitions.

### 5.3 Seed Updates (Corrected Seeder Data)

Update [seed.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/prisma/seed.ts) with deterministic, corrected seed data for plans, menus, permissions, and mappings.

Replace current seeded limits (`Free: 1/5/5`, `Basic: 3/20/25`, `Pro: 10/100/120`) with the canonical matrix below.

#### 5.3.1 Canonical Plan Seed Records

| planName | priceMonthly | propertyLimit | unitLimit (org total) | unitLimitPerProperty | tenantLimit |
|---|---:|---:|---:|---:|---:|
| Free | 0 | 1 | 20 | 20 | 20 |
| Basic | 499 | 3 | 150 | 50 | 120 |
| Pro | 999 | 10 | 600 | 120 | 500 |
| Business | 1799 | 30 | 2500 | 300 | 2000 |
| Enterprise | 2499 | 0 | 0 | 0 | 0 |

Notes:
- `0` still means unlimited.
- `Basic` now aligns with requirement: `3` properties and `50` units per property.

#### 5.3.2 Canonical Menu Catalog Seed

| code | label | routePattern | sortOrder |
|---|---|---|---:|
| `LANDLORD_DASHBOARD` | Dashboard | `/:pgId/overview` | 10 |
| `LANDLORD_PROPERTIES` | Properties | `/:pgId/properties*` | 20 |
| `LANDLORD_TENANTS` | Tenants | `/:pgId/tenants*` | 30 |
| `LANDLORD_LEASES` | Tenant Leases | `/:pgId/leases*` | 40 |
| `LANDLORD_PAYMENTS` | Payments | `/:pgId/payments*` | 50 |
| `LANDLORD_ADDONS` | Add-ons | `/:pgId/addons*` | 60 |
| `LANDLORD_UTILITIES` | Utilities | `/:pgId/utilities*` | 70 |
| `LANDLORD_REPORTS` | Reports | `/:pgId/reports*` | 80 |
| `LANDLORD_SUBSCRIPTION` | Subscription | `/:pgId/subscription*` | 90 |
| `LANDLORD_SETTINGS` | Settings | `/:pgId/settings*` | 100 |

#### 5.3.3 Canonical Permission Catalog Seed

| moduleCode | permissionCode | action |
|---|---|---|
| PROPERTIES | `PROPERTY_VIEW` | VIEW |
| PROPERTIES | `PROPERTY_CREATE` | CREATE |
| PROPERTIES | `PROPERTY_UPDATE` | UPDATE |
| PROPERTIES | `PROPERTY_DELETE` | DELETE |
| UNITS | `UNIT_VIEW` | VIEW |
| UNITS | `UNIT_CREATE` | CREATE |
| UNITS | `UNIT_UPDATE` | UPDATE |
| UNITS | `UNIT_DELETE` | DELETE |
| TENANTS | `TENANT_VIEW` | VIEW |
| TENANTS | `TENANT_CREATE` | CREATE |
| TENANTS | `TENANT_UPDATE` | UPDATE |
| TENANTS | `TENANT_DELETE` | DELETE |
| LEASES | `LEASE_VIEW` | VIEW |
| LEASES | `LEASE_CREATE` | CREATE |
| LEASES | `LEASE_UPDATE` | UPDATE |
| LEASES | `LEASE_CLOSE` | CLOSE |
| PAYMENTS | `PAYMENT_VIEW` | VIEW |
| PAYMENTS | `PAYMENT_RECORD_MANUAL` | RECORD_MANUAL |
| ADDONS | `ADDON_VIEW` | VIEW |
| ADDONS | `ADDON_MANAGE` | MANAGE |
| UTILITIES | `UTILITY_READING_VIEW` | VIEW |
| UTILITIES | `UTILITY_READING_RECORD` | RECORD |
| REPORTS | `REPORT_VIEW` | VIEW |
| REPORTS | `REPORT_EXPORT` | EXPORT |
| MEMBERS | `MEMBER_VIEW` | VIEW |
| MEMBERS | `MEMBER_INVITE` | INVITE |
| MEMBERS | `MEMBER_ROLE_UPDATE` | ROLE_UPDATE |

#### 5.3.4 Canonical Plan-to-Menu Mappings

| Plan | Enabled Menus |
|---|---|
| Free | `LANDLORD_DASHBOARD`, `LANDLORD_PROPERTIES`, `LANDLORD_TENANTS`, `LANDLORD_LEASES`, `LANDLORD_SUBSCRIPTION` |
| Basic | `LANDLORD_DASHBOARD`, `LANDLORD_PROPERTIES`, `LANDLORD_TENANTS`, `LANDLORD_LEASES`, `LANDLORD_SUBSCRIPTION` |
| Pro | Free + `LANDLORD_PAYMENTS`, `LANDLORD_ADDONS`, `LANDLORD_UTILITIES` |
| Business | Pro + `LANDLORD_REPORTS`, `LANDLORD_SETTINGS` |
| Enterprise | all menu codes |

#### 5.3.5 Canonical Plan-to-Permission Mappings

| Plan | Permission Policy |
|---|---|
| Free | View/Create/Update permissions for properties, units, tenants, leases only; no payments, reports, add-ons/utilities manage, or member admin |
| Basic | Free + delete permissions for properties/units/tenants; no payments/reports |
| Pro | Basic + payment, add-on, utility reading permissions |
| Business | Pro + reports and member management permissions |
| Enterprise | all permission codes |

#### 5.3.6 Seeder Implementation Rules

- Use `upsert` for `FeatureMenu`, `FeaturePermission`, and `SubscriptionPlan` keyed by `code`/`planName`.
- Rebuild mapping tables per run for consistency:
  - delete existing `SubscriptionPlanMenu` and `SubscriptionPlanPermission`
  - insert fresh rows from the canonical mapping matrices above
- Keep sample property groups subscribed to:
  - `pg1 -> Basic`
  - `pg2 -> Free`
- Ensure seeded sample data does not violate its assigned plan limits.

## 6. Backend Implementation Plan

### 6.1 Entitlement Module

Create `backend/src/access-control/` with:

- `access-control.service.ts`
- `plan-access.guard.ts`
- `decorators/require-menu.decorator.ts`
- `decorators/require-permission.decorator.ts`
- `constants/menu-codes.ts`
- `constants/permission-codes.ts`

Service responsibilities:

- Resolve active subscription for `propertyGroupId`
- Load plan entitlements (menus + permissions)
- Return computed `AccessContext`
- Cache by `propertyGroupId + accessPolicyVersion` (short TTL)

### 6.2 Guard Strategy

Apply guard after `JwtAuthGuard` and `OrgMemberGuard`.

- `@RequireMenu('LANDLORD_PAYMENTS')` for module/page-level APIs
- `@RequirePermission('PAYMENT_RECORD_MANUAL')` for action-level APIs

New denied response format:

```json
{
  "error": {
    "code": "PLAN_ACCESS_DENIED",
    "message": "Your current subscription plan does not include this feature.",
    "details": {
      "menu": "LANDLORD_PAYMENTS",
      "permission": "PAYMENT_RECORD_MANUAL"
    }
  }
}
```

HTTP status: `403 Forbidden`

### 6.3 Extend Existing Limit Checks

Enhance [subscription-limit.helper.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/common/helpers/subscription-limit.helper.ts):

- Add check type `unit_per_property`
- Enforce both:
  - org total unit limit (`unitLimit`)
  - per-property unit limit (`unitLimitPerProperty`)

Keep current status code `402` for limit-exceeded behavior for backward compatibility.

### 6.4 API Changes

### Admin APIs

Extend `subscription-plan` DTOs and service:

- [create-subscription-plan.dto.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/admin/dto/create-subscription-plan.dto.ts)
- [update-subscription-plan.dto.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/admin/dto/update-subscription-plan.dto.ts)
- [admin.service.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/admin/admin.service.ts)

Payload additions:

- `maxUnitsPerProperty`
- `menuCodes: string[]`
- `permissionCodes: string[]`

Add catalog endpoints:

- `GET /admin/access/menus`
- `GET /admin/access/permissions`

### Landlord APIs

Extend `GET /property-groups/:id/subscription` in [property-groups.service.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/property-groups/property-groups.service.ts):

- Include `plan.access`:
  - `menus: string[]`
  - `permissions: string[]`

This keeps one payload for limits + entitlements.

### 6.5 Guard Rollout by Controller

Phase guard integration:

1. [properties.controller.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/properties/properties.controller.ts)
2. [tenants.controller.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/tenants/tenants.controller.ts)
3. [leases.controller.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/leases/leases.controller.ts)
4. [payments.controller.ts](/Users/jayclarkanore/Documents/Practice/bh/backend/src/payments/payments.controller.ts)
5. Reports endpoints (when backend route is finalized)

## 7. Frontend Implementation Plan

### 7.1 Admin Plan Management UI

Enhance subscription plan page:

- [SubscriptionPlanFormSheet.tsx](/Users/jayclarkanore/Documents/Practice/bh/frontend/src/features/admin/subscription-plans/SubscriptionPlanFormSheet.tsx)
- [SubscriptionPlansTable.tsx](/Users/jayclarkanore/Documents/Practice/bh/frontend/src/features/admin/subscription-plans/SubscriptionPlansTable.tsx)
- [admin.schema.ts](/Users/jayclarkanore/Documents/Practice/bh/frontend/src/lib/validations/admin.schema.ts)
- [admin.api.ts](/Users/jayclarkanore/Documents/Practice/bh/frontend/src/lib/api/admin.api.ts)

UI additions:

- Limits section:
  - `Max Properties`
  - `Max Units (Org Total)`
  - `Max Units Per Property`
  - `Max Tenants`
- Menus multi-select checklist (grouped by module)
- Permissions matrix (View/Create/Update/Delete/etc.)
- "Copy from plan" action
- Read-only summary panel for quick validation before save

### 7.2 Landlord Dynamic Navigation

Update [Sidebar.tsx](/Users/jayclarkanore/Documents/Practice/bh/frontend/src/components/layout/Sidebar.tsx):

- Replace hardcoded landlord menu with catalog-driven map.
- Filter menu items by `subscription.plan.access.menus`.
- Keep active route logic intact.

### 7.3 Route-Level UX Guard

Implement `PlanGate` helper (frontend) to block page rendering for disallowed menus:

- Show existing [ForbiddenPage.tsx](/Users/jayclarkanore/Documents/Practice/bh/frontend/src/components/common/ForbiddenPage.tsx) with plan-specific message.
- Redirect to first accessible menu if desired UX is redirect-first.

Note: frontend guard is UX-only; backend guard is the security boundary.

### 7.4 Subscription Display

Enhance landlord subscription page [subscription/page.tsx](/Users/jayclarkanore/Documents/Practice/bh/frontend/app/(landlord)/[pgId]/subscription/page.tsx):

- Show enabled menus
- Show permissions summary
- Show limits including per-property unit cap

## 8. Permission and Menu Taxonomy

### 8.1 Suggested Menu Codes

- `LANDLORD_DASHBOARD`
- `LANDLORD_PROPERTIES`
- `LANDLORD_TENANTS`
- `LANDLORD_LEASES`
- `LANDLORD_PAYMENTS`
- `LANDLORD_REPORTS`
- `LANDLORD_ADDONS`
- `LANDLORD_UTILITIES`
- `LANDLORD_SUBSCRIPTION`
- `LANDLORD_SETTINGS`

### 8.2 Suggested Permission Codes

- Properties: `PROPERTY_VIEW`, `PROPERTY_CREATE`, `PROPERTY_UPDATE`, `PROPERTY_DELETE`
- Units: `UNIT_VIEW`, `UNIT_CREATE`, `UNIT_UPDATE`, `UNIT_DELETE`
- Tenants: `TENANT_VIEW`, `TENANT_CREATE`, `TENANT_UPDATE`, `TENANT_DELETE`
- Leases: `LEASE_VIEW`, `LEASE_CREATE`, `LEASE_UPDATE`, `LEASE_CLOSE`
- Payments: `PAYMENT_VIEW`, `PAYMENT_RECORD_MANUAL`
- Add-ons: `ADDON_VIEW`, `ADDON_MANAGE`
- Utilities: `UTILITY_READING_VIEW`, `UTILITY_READING_RECORD`
- Reports: `REPORT_VIEW`, `REPORT_EXPORT`
- Membership/Settings: `MEMBER_VIEW`, `MEMBER_INVITE`, `MEMBER_ROLE_UPDATE`

## 9. Access Resolution Rules

1. User must pass existing auth + org membership guards.
2. Active subscription must exist.
3. Endpoint-required menu must be enabled in plan.
4. Endpoint-required permission must be enabled in plan.
5. Existing org role checks still apply.
6. For create flows, existing limit checks still apply.

## 10. Canonical Subscription Tiers (Seed Source of Truth)

### 10.1 Free

- Menus:
  - Dashboard
  - Properties
  - Tenants
  - Leases
  - Subscription
- Restricted:
  - Payments
  - Reports
  - Add-ons
  - Utilities
  - Settings
- Limits:
  - Max properties: `1`
  - Max units total: `20`
  - Max units per property: `20`
  - Max tenants: `20`

### 10.2 Basic

- Menus:
  - Dashboard
  - Properties
  - Tenants
  - Leases
  - Subscription
- Restricted:
  - Payments
  - Reports
  - Add-ons
  - Utilities
  - Settings
- Limits:
  - Max properties: `3`
  - Max units total: `150`
  - Max units per property: `50`
  - Max tenants: `120`

### 10.3 Pro

- Menus:
  - Free menus
  - Payments
  - Add-ons
  - Utilities
- Restricted:
  - Reports
  - Settings
- Limits:
  - Max properties: `10`
  - Max units total: `600`
  - Max units per property: `120`
  - Max tenants: `500`

### 10.4 Business

- Menus:
  - Pro menus
  - Reports
  - Settings
- Limits:
  - Max properties: `30`
  - Max units total: `2500`
  - Max units per property: `300`
  - Max tenants: `2000`

### 10.5 Enterprise

- Menus: all enabled
- Permissions: all enabled
- Limits: unlimited (`0` convention)

## 11. Migration and Rollout Plan

### 11.1 DB Migration

1. Add new columns/tables.
2. Seed catalogs and mappings.
3. Backfill plan mappings for existing plans.

Backfill rule for existing custom plans:

- Set full menu+permission access initially to avoid accidental production lockout.
- Admin can tighten access afterwards.

### 11.2 Feature Flag Rollout

Add env flag: `PLAN_ENTITLEMENTS_ENABLED`

- `false` (default first deploy): collect data, no access denial.
- `true`: enforce plan menu/permission guards.

### 11.3 Rollout Steps

1. Deploy schema + seed + API read support.
2. Deploy admin UI for plan entitlement editing.
3. Populate/verify all plan mappings.
4. Enable feature flag in staging.
5. Run end-to-end entitlement tests.
6. Enable feature flag in production.

## 12. Testing Strategy

### 12.1 Backend Unit Tests

- AccessControlService returns correct entitlements.
- Guard denies when menu missing.
- Guard denies when permission missing.
- Guard allows when both present.
- Per-property and total unit limit checks both enforced.

### 12.2 Backend E2E Tests

- Basic plan user gets `403 PLAN_ACCESS_DENIED` for payments/reports.
- Basic plan user can still access dashboard/tenants/leases.
- Exceeding property/unit/tenant limits returns current `402` behavior.

### 12.3 Frontend Tests

- Sidebar hides disallowed menus.
- Direct route to hidden menu shows forbidden state.
- Admin plan form persists menu/permission selections correctly.

## 13. Observability and Audit

- Add audit entries when plan entitlements are updated:
  - old menu list vs new menu list
  - old permission list vs new permission list
- Emit structured logs for denied access with:
  - `userId`, `propertyGroupId`, `planName`, `menuCode`, `permissionCode`

## 14. Delivery Phases and Estimates

1. Phase 1: Schema + seed + DTO/API updates (2-3 days)
2. Phase 2: Backend guard/decorator + controller integration (2-3 days)
3. Phase 3: Admin UI for entitlement management (2-4 days)
4. Phase 4: Landlord dynamic menu + route gating (1-2 days)
5. Phase 5: E2E, rollout, and stabilization (2-3 days)

Total: ~9-15 working days.

## 15. Acceptance Criteria

- System Admin can create/update plan limits, menus, and permissions.
- Landlord navigation reflects active subscription entitlements.
- Disallowed module URLs are blocked in UI and API.
- Existing role checks remain functional.
- Usage limits remain enforced, including units-per-property.
- Audit trail captures entitlement changes.
