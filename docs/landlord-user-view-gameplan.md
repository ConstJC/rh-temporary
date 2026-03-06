# Landlord User View — Implementation Gameplan (Execution Version)

Reference pages:
- `docs/renthub-architecture-dashboard-v3.html`
- `frontend/app/(landlord)/[pgId]/*`

Date baseline: **March 6, 2026**

## Goal
Ship a landlord web experience that is production-usable for daily operations first, then extend to add-ons/utilities billing without redesigning the data model.

---

## 1) Current Implementation Snapshot (March 6, 2026)

## 1.1 Landlord Web (implemented)
- Working route shell: `/:pgId/*`
- Live list/detail flows:
  - `/:pgId/overview`
  - `/:pgId/properties`
  - `/:pgId/properties/[propertyId]`
  - `/:pgId/tenants`
  - `/:pgId/tenants/[tenantId]`
  - `/:pgId/leases`
  - `/:pgId/leases/[leaseId]`
  - `/:pgId/payments`
  - `/:pgId/payments/[paymentId]`
- Newly implemented forms/routes:
  - `/:pgId/properties/new`
  - `/:pgId/properties/[propertyId]/units/new`
  - `/:pgId/units/[unitId]`
  - `/:pgId/tenants/new`
  - `/:pgId/leases/new`
  - `/:pgId/payments/[paymentId]/record`
- Added landlord nav entries for roadmap pages:
  - `/:pgId/addons`
  - `/:pgId/utilities`
  - `/:pgId/reports`
  - `/:pgId/subscription`
  - `/:pgId/settings`
  - (currently roadmap/status placeholders)

## 1.2 Backend API alignment completed
- Added missing landlord read endpoints:
  - `GET /property-groups/:pgId/properties/:id`
  - `GET /property-groups/:pgId/units`
  - `GET /units/:unitId`
- Added tenant delete endpoint:
  - `DELETE /property-groups/:pgId/tenants/:id`
- Enriched list payloads used by landlord UI:
  - properties list now includes `_count.units`
  - tenant lists/details include `unit.property`
  - payment list includes `lease.unit.property`
- Frontend API client route fixes:
  - lease detail/update now use `/leases/:leaseId`
  - payment detail now uses `/payments/:id`
  - manual payment now uses `PATCH /payments/:id/manual`

---

## 2) Route Delivery Plan

## Phase 1 (Core Operations) — **Primary**
1. Overview dashboard
2. Properties + units
3. Tenants
4. Leases
5. Payments + manual recording

## Phase 2 (Billing Expansion)
1. Add-on catalog management (org-scoped)
2. Unit add-on assignment
3. Utility readings entry
4. Add-on bill generation and viewing

## Phase 3 (Operational Maturity)
1. Reports
2. Subscription usage page
3. Notifications, reminders, missing-reading alerts

---

## 3) Backend API Matrix (Landlord)

| Area | Endpoint | Status | Notes |
|---|---|---|---|
| Overview | `GET /property-groups/:id/stats/overview` | Ready | Used by dashboard |
| Properties list/create/update/delete | `/property-groups/:pgId/properties` | Ready | In use |
| Property detail | `GET /property-groups/:pgId/properties/:id` | Ready | Added |
| Units by property | `GET/POST /properties/:propId/units` | Ready | In use |
| Units by org | `GET /property-groups/:pgId/units` | Ready | Added, used by Lease Create |
| Unit detail/update/delete | `/units/:unitId` | Ready | GET added |
| Tenants list/create/detail/update | `/property-groups/:pgId/tenants` | Ready | In use |
| Tenant delete | `DELETE /property-groups/:pgId/tenants/:id` | Ready | Added |
| Leases list/create | `/property-groups/:pgId/leases` | Ready | In use |
| Lease detail/update/close | `/leases/:leaseId` | Ready | Frontend aligned |
| Payments list | `GET /property-groups/:pgId/payments` | Ready | Enriched payload |
| Payment detail/manual | `/payments/:id`, `/payments/:id/manual` | Ready | Frontend aligned |
| Add-on catalog (landlord scope) | `/property-groups/:pgId/addon-catalog` | Missing | Phase 2 backend task |
| Unit add-on assignment | `/property-groups/:pgId/units/:unitId/addons` | Missing | Phase 2 backend task |
| Utility readings | `/property-groups/:pgId/utility-readings` | Missing | Phase 2 backend task |
| Billing generation | `/property-groups/:pgId/billing/generate` | Missing | Phase 2 backend task |
| Lease add-on bill view | `/property-groups/:pgId/leases/:leaseId/addon-bills` | Missing | Phase 2 backend task |

---

## 4) Required Backend Modifications (Next)

## P0 (recommended next sprint)
1. Landlord billing module (new)
- Add controller/service for add-on catalog, unit add-ons, utility readings, bill generation.
- Scope all queries by `property_group_id`.

2. Validation guardrails
- Meter reading: enforce `currentReading >= previousReading`.
- Prevent duplicate reading for same `unitAddonId + period`.
- Respect `effectiveFrom/effectiveUntil` in bill generation.

3. Contract consistency
- Keep response shape `{ data, meta? }` for all landlord APIs.
- Keep numeric serialization consistent for Decimal fields.

## P1
1. Lease lifecycle improvements
- Add explicit landlord “terminate lease” action endpoint semantics (if different from close).

2. Payments
- Add server-side safeguards for overpayment policy (allow/disallow) per organization setting.

## P2
1. Audit completeness
- Ensure add-on and utility endpoints write audit events (`INSERT/UPDATE/DELETE`).

2. Reporting API
- Add aggregated endpoints for monthly income, occupancy trend, and tenant ledger export.

---

## 5) Frontend Tasks Remaining

## Done in this cycle
- Implemented missing create flows and record-payment flow.
- Fixed route mismatches to backend APIs.
- Added unit detail route.
- Added non-breaking placeholders for phase-2/3 landlord pages.

## Next UI iteration
1. Add-on catalog CRUD UI (`/:pgId/addons`) once backend endpoints are live.
2. Utility readings entry table/form (`/:pgId/utilities`) with duplicate-read guard handling.
3. Billing line-item views under payment/lease detail.
4. Reports and subscription usage dashboards.

---

## 6) Simple Billing Architecture (Keep This)

Use existing tables as designed:
- `unit_addon_catalog` (templates)
- `unit_addons` (per-unit assignments)
- `utility_readings` (meter logs)
- `lease_addon_bills` (generated bill lines)

Single billing engine rules:
1. `FLAT_FEE` → `amountDue = rate`
2. `METERED` → `amountDue = (current - previous) * ratePerUnit`
3. `FIXED_AMENITY` → either zero line-item or no bill row (define one policy and keep it consistent)

---

## 7) Definition of Done (Landlord Core)
- Landlord can create property, unit, tenant, and lease from web UI.
- Lease creation only allows available units and creates initial payment rows.
- Landlord can record manual payments and view balance updates.
- All landlord list/detail pages resolve against valid backend endpoints.
- No dead links in core landlord flows.

## 8) Definition of Done (Billing Expansion)
- Landlord can configure utility/add-on charges per unit.
- Landlord can submit readings and trigger addon bill generation.
- Payment detail can display rent + addon bill line items for the selected period.
- Guardrails prevent invalid readings and duplicate period billing.
