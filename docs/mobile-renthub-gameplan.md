# RentHub Mobile Gameplan (Design + Delivery)

**Date:** 2026-03-19  
**Owner:** Product + Mobile + Backend  
**Status:** Proposed

## 1. Objective

Ship a production-ready **RentHub mobile app** for landlords and tenants that supports:

1. Daily operations (leases, payments, tenant/property management)
2. Fast tenant bill visibility and payment actions
3. Real-time alerts (due, overdue, payment posted, lease updates)

## 2. Product Scope

### 2.1 In Scope (MVP)

- Cross-platform app (iOS + Android)
- Role-aware experience:
  - `LANDLORD` workspace
  - `TENANT` workspace
- Auth + org selection
- Dashboard, properties/units, tenants, leases, payments
- Tenant bills, history, notifications, profile
- Push notifications

### 2.2 Out of Scope (Post-MVP)

- Full admin console in mobile
- Complex report builder
- Advanced offline editing conflict resolution

## 3. Experience Principles

1. **2-tap priority:** most common actions in two taps (record payment, view bill, contact tenant).
2. **Status-first UI:** paid/due/overdue/available states are always visible.
3. **Role-safe design:** expose only allowed screens by role and plan entitlement.
4. **Fast on poor networks:** skeleton states, stale-while-revalidate, retry patterns.

## 4. Target Users and Jobs

| User | Primary Jobs |
|---|---|
| Landlord Owner/Admin | Track occupancy, manage leases, collect and record payments |
| Landlord Staff | Execute daily operations with role-limited actions |
| Tenant | Check bills, pay on time, review receipts, receive reminders |

## 5. IA and Navigation

### 5.1 App Entry

1. Splash
2. Auth (login/register/forgot/reset)
3. Org selection (if multiple property groups)
4. Route to role workspace

### 5.2 Landlord Bottom Tabs

- `Home`
- `Properties`
- `Payments`
- `Leases`
- `More` (tenants, add-ons, utilities, subscription, settings)

### 5.3 Tenant Bottom Tabs

- `Home`
- `Bills`
- `Notifications`
- `Profile`

## 6. Screen Inventory

### 6.1 Shared

- Login
- Register
- Forgot/Reset Password
- Verify Email
- Select Organization
- Account/Profile

### 6.2 Landlord

- Home Dashboard
- Property List
- Property Detail
- Unit Detail
- Tenant List
- Tenant Detail
- Lease List
- Lease Detail
- Payments List
- Payment Detail
- Record Manual Payment
- Add-ons (view/manage)
- Utilities (readings list + add reading)
- Subscription Summary (plan + usage)

### 6.3 Tenant

- Home Summary
- Bills List
- Bill Detail
- Payment Checkout Handoff
- Receipt Viewer
- Notifications Feed
- Profile + Password

## 7. Core Flows (Design-Level)

### 7.1 Landlord Manual Payment

1. Open `Payments`
2. Select overdue/unpaid bill
3. Tap `Record Payment`
4. Input amount/method/reference/date
5. Confirm and show updated ledger

### 7.2 Tenant Bill Payment

1. Open `Bills`
2. Open bill details and review line items
3. Tap `Pay Now`
4. Redirect to gateway flow
5. Return to app with pending/success state

### 7.3 Lease Creation (Mobile-optimized Wizard)

1. Select property/unit
2. Select tenant
3. Set lease terms (rent, due day, grace)
4. Review and create

## 8. Design System Direction

### 8.1 Foundations

- 8px spacing scale
- 4 status colors: success, warning, danger, info
- Typography tokens: title, section, body, caption
- Elevation tokens for cards/sheets

### 8.2 Mobile Components

- KPI card
- Status badge
- Filter chips
- Bottom sheet form
- Timeline row (payments/notifications)
- Empty/error/retry blocks

### 8.3 Interaction Patterns

- Pull to refresh on list pages
- Sticky quick actions on details
- Progressive disclosure for advanced form fields

## 9. Technical Stack (Recommended)

- **Framework:** React Native + Expo (TypeScript)
- **State/Data:** TanStack Query + lightweight local state store
- **Forms/Validation:** React Hook Form + Zod
- **Navigation:** Expo Router / React Navigation
- **Push:** FCM + APNS via Expo Notifications
- **API:** Reuse backend REST contracts and auth model

Reasoning: TypeScript alignment with existing Next.js + NestJS codebase reduces integration and maintenance cost.

## 10. Backend/API Alignment

Map existing backend domains directly:

- `auth` -> login/register/reset/refresh
- `property-groups` -> org selection + scoped context
- `properties`, `tenants`, `leases`, `payments` -> landlord workflows
- `me/*` endpoints -> tenant profile, bills, receipts, notifications

Required additions for mobile quality:

- Device token registration endpoint for push
- Notification read/read-all support (if not fully completed)
- Lightweight dashboard summary endpoint optimized for mobile payload

## 11. Security and Access Controls

- Store tokens in secure device storage
- Refresh token rotation on app resume/session restore
- Enforce role + plan entitlement server-side for every protected API
- Hide restricted screens client-side (UX), block on backend (security)

## 12. Performance and Reliability Targets

- Cold start: `< 2.5s` on mid-range Android
- P95 screen data load: `< 1.2s` on good network
- Crash-free sessions: `> 99.5%`
- App API error rate: `< 1%` non-4xx

## 13. Delivery Plan

### Phase 0: Foundation (1 week)

- App shell, auth plumbing, org context
- Design tokens and shared components
- CI build pipeline + staging environment

### Phase 1: Landlord Core (2-3 weeks)

- Dashboard, properties/units, tenants, leases, payments
- Manual payment recording
- Basic filters/search and pagination

### Phase 2: Tenant Core (1-2 weeks)

- Home summary, bills, bill detail, checkout handoff
- Receipts and profile
- Notification feed

### Phase 3: Hardening + Launch (1 week)

- Push notifications end-to-end
- Performance tuning, analytics, crash monitoring
- UAT, bug fixes, app store assets/submission

## 14. QA and Acceptance Criteria

### 14.1 Functional

- No role can access unauthorized route/action
- Billing status updates reflect within one refresh cycle
- All core flows complete without web fallback except payment gateway handoff

### 14.2 Non-Functional

- Offline state handled gracefully (read-only cached data + retry)
- All critical pages have loading/error/empty states
- Telemetry events fire for key conversion points

## 15. Analytics Events (MVP)

- `login_success`
- `org_selected`
- `bill_viewed`
- `pay_now_clicked`
- `payment_recorded_manual`
- `lease_created`
- `push_opened`

## 16. Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| API shape drift between web and mobile | Rework and delays | Contract tests + shared DTO review per sprint |
| Notification delivery inconsistency | Missed payment reminders | Token health checks + fallback in-app notifications |
| Complex landlord forms on small screens | Input errors | Stepper flows + validation + summaries before submit |
| Plan entitlement mismatches | Access bugs | Centralized backend guard + client capability endpoint |

## 17. Definition of Done (MVP)

1. Landlord and tenant role flows are production-usable on iOS and Android.
2. Push reminders and payment status updates are operational.
3. Crash/performance targets are met for two consecutive release candidates.
4. App store submission package and support docs are complete.
