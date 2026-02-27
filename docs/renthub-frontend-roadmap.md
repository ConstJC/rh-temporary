# 🏠 RentHub — Frontend Roadmap

> Next.js 15 · TypeScript · Tailwind CSS · TanStack Query · **5 phases · 8 weeks**

**Web app for SYSTEM_ADMIN + LANDLORD only.** Tenant portal is mobile-only (Flutter).

**Aligned with:** [RentHub System Architecture Specification v2.1](renthub-architecture-dashboard-v2.html) and the **current backend** (`/backend` — NestJS, Prisma, global prefix `/api`). See [§12 Alignment with current backend](#alignment-with-current-backend-codebase) for exact routes and response shapes.

---

## Table of Contents

1. [Project Overview & Portal Architecture](#1-project-overview--portal-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Folder Structure](#3-folder-structure)
4. [Complete Route Map](#4-complete-route-map)
5. [Key Architecture Patterns](#5-key-architecture-patterns)
6. [Page-by-Page Build Spec](#6-page-by-page-build-spec)
7. [Component Standards & Rules](#7-component-standards--rules)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [Build Phases](#9-build-phases)
10. [Bootstrap Commands](#10-bootstrap-commands)
11. [Definition of Done](#11-definition-of-done)
12. [References & Alignment](#12-references--alignment)

---

## 1. Project Overview & Portal Architecture

RentHub is a multi-tenant SaaS platform that serves **three distinct user types**. The **web app** implements **System Admin** and **Landlord** portals only; the Tenant portal is mobile-only (Flutter).

**North Star (from Architecture):** *"A simple platform that helps small landlords track tenants, payments, and occupancy — so they always know who owes rent — and tenants can see and pay their bills in one place."*

### Portal summary

| | 🏛 System Admin | 🏠 Landlord Portal | 👤 Tenant Portal |
|---|---|---|---|
| **Users** | Platform superusers | Property owners & staff | Renters |
| **Primary Goal** | Platform health & billing | Manage properties, tenants, billing | View bills & pay rent |
| **Route Prefix** | `/dashboard` | `/:pgId/` | `/portal` (mobile-only) |
| **Features** | Platform metrics, all landlords, subscription management, feature flags | Property/unit mgmt, tenant mgmt, lease creation, payment recording, add-on config | Active lease, payment history, bill breakdown, online payment, profile |

### Two-layer auth (aligned with backend)

Backend uses **UserRole** (JWT auth gate) and **UserType** (app routing). Frontend must store both and route accordingly.

| Layer | Values | Purpose |
|-------|--------|---------|
| **UserRole** | `ADMIN` \| `USER` | API gate — RolesGuard on backend. ADMIN → `/admin/*` API access. |
| **UserType** | `SYSTEM_ADMIN` \| `LANDLORD` \| `TENANT` | App routing. SYSTEM_ADMIN → web `/dashboard`; LANDLORD → web `/:pgId/overview`; TENANT → "Use mobile app" on web. |

**Landlord org roles (PropertyGroupMembers):** For landlord portal, backend enforces **OrgRole** per property group: `OWNER` (full org settings, members, delete), `ADMIN` (properties, tenants, leases, payments), `STAFF` (read-only + payment confirmation). Frontend may hide or disable OWNER-only actions (e.g. delete property group, invite/remove members) for non-OWNER users.

### Core data hierarchy (from Architecture)

All landlord data is scoped by `property_group_id`. Frontend types and API calls must follow this chain:

- **PropertyGroup** → Property → Unit → Lease → Payment → Transactions  
- **Unit** → UnitAddonCatalog → UnitAddon → LeaseAddonBill → UtilityReading (add-ons: WiFi, electricity, etc.)

Bill breakdown on payment detail = base rent + **LeaseAddonBill** line items (FLAT_FEE or METERED). Add-on catalog and meter reading entry are part of backend Phase 2 (Dashboard UI & Add-ons).

---

## 2. Technology Stack

| Category | Technology | Justification |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server Components, file-based routing, streaming. |
| **Language** | TypeScript 5.x | End-to-end type safety. Share types from backend API responses. |
| **Styling** | Tailwind CSS 4 | Utility-first, no runtime overhead. Works with React Server Components. |
| **UI Components** | shadcn/ui + Radix UI | Accessible primitives. Copy-paste — no vendor lock-in. |
| **Data Fetching** | TanStack Query v5 | Server state, caching, background refetch, optimistic updates. |
| **Forms** | React Hook Form + Zod | Performant forms. Zod schemas shared with backend validation. |
| **Global State** | Zustand | Minimal (auth session, sidebar, notifications). |
| **HTTP Client** | Axios + custom wrapper | Interceptors for JWT attach, 401 refresh, error normalization. |
| **Auth** | next-auth v5 (Auth.js) | JWT storage, session management, route protection middleware. |
| **Charts** | Recharts | Dashboard metrics and payment charts. |
| **Tables** | TanStack Table v8 | Headless table with sorting, filtering, pagination. |
| **Date Handling** | date-fns | Lease period formatting, due date calculations. |
| **Icons** | Lucide React | Consistent icon set, tree-shakeable. |
| **Notifications** | Sonner | Toast notifications. |
| **Linting** | ESLint + Prettier | eslint-config-next + TypeScript rules. |
| **Testing** | Vitest + Testing Library + Playwright | Unit (Vitest), E2E (Playwright). |

**Ecosystem (from Architecture):** Backend = NestJS + Prisma + PostgreSQL (JWT, RolesGuard + UserTypeGuard). Mobile = Flutter (Landlord on-the-go + Tenant portal). Payments = Dragonpay (GCash, Maya, bank). Notifications = Email, SMS, Push (FCM). Frontend web consumes REST API only.

---

## 3. Folder Structure

```
renthub-frontend/
├── src/
│   ├── app/                            # Next.js App Router root
│   │   ├── (auth)/                     # Route group — no layout wrapper
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── verify-email/
│   │   │
│   │   ├── (admin)/                    # System Admin portal
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── landlords/
│   │   │       ├── subscriptions/
│   │   │       └── settings/
│   │   │
│   │   ├── (landlord)/                 # Landlord portal
│   │   │   ├── layout.tsx
│   │   │   └── [pgId]/
│   │   │       ├── layout.tsx          # PropertyGroupProvider
│   │   │       ├── overview/
│   │   │       ├── properties/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/
│   │   │       │   └── [propId]/
│   │   │       ├── tenants/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/
│   │   │       │   └── [tenantId]/
│   │   │       ├── leases/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/            # 3-step wizard
│   │   │       │   └── [leaseId]/
│   │   │       └── payments/
│   │   │           ├── page.tsx
│   │   │           └── [paymentId]/
│   │   │
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives
│   │   ├── layout/                      # AppShell, Sidebar, TopBar, MobileNav
│   │   ├── forms/                      # FormWrapper, FormField, SubmitButton
│   │   ├── tables/                     # DataTable, Pagination, Filters
│   │   ├── charts/                     # MetricCard, OccupancyChart, PaymentChart
│   │   ├── modals/                     # ConfirmDialog, SlideOver
│   │   └── common/                     # StatusBadge, EmptyState, LoadingSkeleton, PageHeader
│   │
│   ├── features/
│   │   ├── auth/                       # LoginForm, RegisterForm, ResetPasswordForm
│   │   ├── properties/                 # PropertyForm, UnitGrid, UnitDetailSlideOver
│   │   ├── tenants/                    # TenantForm, TenantDetailPanel
│   │   ├── leases/                     # CreateLeaseWizard, LeaseTimeline, CloseLeaseDialog
│   │   └── payments/                   # RecordPaymentForm, BillBreakdown
│   │
│   ├── hooks/                          # useAuth, usePropertyGroup, usePagination, useDebounce
│   ├── lib/
│   │   ├── api/                        # client.ts, auth.api, property-groups.api, properties.api, etc.
│   │   ├── validations/                # auth.schema, property.schema, tenant.schema, lease.schema, payment.schema
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── auth.config.ts
│   ├── stores/                         # auth.store, sidebar.store
│   ├── types/                          # api.types, domain.types, auth.types
│   └── middleware.ts
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── components.json
└── tsconfig.json
```

---

## 4. Complete Route Map

### Auth Routes (Public)

| Route | Purpose | Guard |
|---|---|---|
| `/login` | Login with credentials | Public |
| `/register` | New landlord signup | Public |
| `/forgot-password` | Request password reset email | Public |
| `/reset-password` | Reset password with token | Public |
| `/verify-email` | Email verification confirmation | Public |

### Landlord Portal Routes

| Route | Purpose | Guard |
|---|---|---|
| `/:pgId/overview` | Dashboard — KPIs, occupancy, overdue alerts | Landlord |
| `/:pgId/properties` | Property list with unit count summary | Landlord |
| `/:pgId/properties/new` | Create property form | Landlord |
| `/:pgId/properties/:propId` | Property detail + unit grid | Landlord |
| `/:pgId/properties/:propId/units/new` | Add unit to property | Landlord |
| `/:pgId/tenants` | Tenant list with search and filters | Landlord |
| `/:pgId/tenants/new` | Create tenant record | Landlord |
| `/:pgId/tenants/:tenantId` | Tenant detail — leases, payments, notes | Landlord |
| `/:pgId/leases` | Lease list with status filter tabs | Landlord |
| `/:pgId/leases/new` | Create lease — 3-step wizard | Landlord |
| `/:pgId/leases/:leaseId` | Lease detail — payment timeline, addons | Landlord |
| `/:pgId/payments` | Payment list — all leases, filterable | Landlord |
| `/:pgId/payments/:paymentId` | Payment detail — bill breakdown, transactions | Landlord |

### System Admin Routes

| Route | Purpose | Guard |
|---|---|---|
| `/dashboard` | Platform metrics — MRR, users, churn | Admin (SYSTEM_ADMIN) |
| `/dashboard/landlords` | All landlord accounts + property groups | Admin |
| `/dashboard/subscriptions` | Subscription plan management | Admin |
| `/dashboard/settings` | Platform settings & feature flags | Admin |

**Note:** Backend API uses `/admin/*` for System Admin endpoints. Frontend route `/dashboard` is the web URL; all data is fetched via admin API (e.g. `GET /admin/property-groups`). For Landlord, some actions require **OrgRole OWNER** (e.g. PATCH/DELETE property group, invite/remove members); backend returns 403 if user is STAFF/ADMIN — frontend should hide those actions for non-OWNER when possible.

---

## 5. Key Architecture Patterns

### 5.1 API Client Pattern

All HTTP calls go through a **single Axios instance**: one place for JWT attach, 401 refresh, and error normalization. Request interceptor attaches `Authorization: Bearer <accessToken>` from next-auth session. Response interceptor: 401 → signOut + redirect `/login`; 402 → upgrade page; 403 → forbidden page; normalize errors to `{ message, statusCode, errors[] }`.

### 5.2 TanStack Query Pattern

Use **query key factories** per feature (e.g. `leaseKeys.all(pgId)`, `leaseKeys.list(pgId, filters)`, `leaseKeys.detail(leaseId)`). Colocate hooks with the feature. Mutations invalidate relevant query keys and show `toast.success` / `toast.error`.

### 5.3 Form Pattern

**Zod schema first** — drives validation and TypeScript type via `z.infer<>`. React Hook Form + `zodResolver(schema)`. No duplicate types.

### 5.4 Route Protection Pattern

Protect all portal routes at the **edge** in `middleware.ts`. Public routes: login, register, forgot-password, reset-password, verify-email. Unauthenticated → `/login`. Logged-in on auth page → redirect by userType (SYSTEM_ADMIN → `/dashboard`, LANDLORD → first `/:pgId/overview`, TENANT → show "use mobile app"). LANDLORD hitting `/dashboard` → redirect to `/:pgId/overview`.

### 5.5 Property Group Context Pattern

Landlord portal is scoped to `/:pgId`. `PropertyGroupProvider` at `[pgId]/layout.tsx` fetches current property group; `usePropertyGroup()` exposes `{ id, groupName, currencyCode, subscription }`.

### 5.6 Type System Pattern

Domain types in `types/domain.types.ts` (Property, Unit, Lease, Payment, Tenant, enums). API wrappers in `types/api.types.ts`: `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`. Enums must match backend exactly: `LeaseStatus`, `UnitStatus`, `PaymentStatus`, `UserType`, `UserRole`, `OrgRole`, `AddonBillingType`, etc.

### 5.7 Backend triggers that affect UX (from Architecture)

These backend events imply the frontend should refetch or show feedback:

| Event | Frontend action |
|-------|------------------|
| Lease activated | Invalidate lease + unit queries; unit → OCCUPIED; show toast "Lease created" |
| Lease closed | Invalidate lease + unit + tenant; unit → AVAILABLE; redirect or refresh list |
| Cron billing (daily) | Payments may appear; consider staleTime or refetch on payments list focus |
| Meter reading entered | LeaseAddonBill created; refetch payment/addon-bills for that lease |
| Payment webhook SUCCESS | Payment → PAID; invalidate payment detail; toast "Payment confirmed" |
| Subscription expired | 402 or plan limit; show UpgradePlanBanner; block create flows |

---

## 6. Page-by-Page Build Spec

### Overview Dashboard `/:pgId/overview`

- **KPI cards:** Total Units, Occupied, Available, Overdue count; each with trend vs last month.
- **Below:** Occupancy donut (Recharts), Recent payments table (last 10), Overdue alerts list, Quick actions: + New Tenant, + New Lease, Record Payment.

### Properties Page `/:pgId/properties`

- PropertyGrid — one card per property: name, address, type badge, unit chips (available/occupied/maintenance). Empty state + "Add your first property". "+ Add Property" opens SlideOver.

### Property Detail `/:pgId/properties/:propId`

- Header (name, address, type, edit). UnitGrid color-coded by UnitStatus (AVAILABLE, OCCUPIED, MAINTENANCE, NOT_AVAILABLE). Unit card: name, type, rent, tenant if occupied. Click unit → UnitDetailSlideOver. "+ Add Unit" → CreateUnitSlideOver.

### Leases Page `/:pgId/leases`

- Tabs: All / Active / Closed / Expired. LeaseTable: tenant, unit, rent, move-in, billing day, status, payment summary (due/paid progress). Create Lease: 3-step wizard — (1) Select Unit, (2) Select/Create Tenant, (3) Lease Terms — then submit, invalidate queries, redirect to lease detail.

### Payments Page `/:pgId/payments`

- Filters: Status, date range, tenant search. PaymentTable: tenant, unit, period, amount due/paid, status badge, due date. Detail: **BillBreakdown** = base rent + **LeaseAddonBill** line items (add-ons: FLAT_FEE e.g. WiFi, or METERED e.g. electricity from utility readings). Record Payment: RecordPaymentSlideOver — amount, method (CASH / GCASH / BANK_TRANSFER), notes. (E-payment initiate → Dragonpay redirect is backend Phase 3; frontend can add "Pay online" button when API is ready.)

### Tenant Detail `/:pgId/tenants/:tenantId`

- Header (name, phone, email, status). Emergency contact, active lease summary, lease history table, payment summary. **Internal notes — landlord-only; never on tenant-facing pages.** Actions: Edit, Blacklist (ConfirmDialog).

---

## 7. Component Standards & Rules

### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Pages | `page.tsx` | `app/(landlord)/[pgId]/leases/page.tsx` |
| Components | `PascalCase.tsx` | `LeaseStatusBadge.tsx` |
| Hooks | `useFeatureName.ts` | `useLeases.ts` |
| API files | `feature.api.ts` | `leases.api.ts` |
| Query keys | `featureKeys.list/detail()` | `leaseKeys.list(pgId, filters)` |
| Schemas | `featureNameSchema` | `createLeaseSchema` |
| Types | `FeatureNameDto` | `CreateLeaseDto` |

### Component Rules

- **Server Components by default.** Add `'use client'` only for hooks, event handlers, or browser APIs.
- **Never fetch in client components** — use TanStack Query hooks.
- **All forms:** React Hook Form + Zod resolver.
- **All mutations:** loading state, disable submit while pending.
- **All lists:** LoadingSkeleton on first load, subtle spinner on refetch.
- **All delete/destructive actions:** ConfirmDialog first.
- **SlideOver for create/edit** — no navigation away from list.
- **StatusBadge:** Centralized status config (PAID, UNPAID, OVERDUE, ACTIVE, CLOSED, etc.) — no ad-hoc inline colors.

---

## 8. Error Handling Strategy

| Scenario | Handling |
|----------|-----------|
| API error | Axios interceptor → normalize to `ApiError` shape. Backend returns `{ error: { code, message, details? } }` — map to `{ message, statusCode, errors[] }` for forms. |
| Form validation | Inline below fields via RHF |
| Mutation error | `toast.error(error.message)` |
| 401 | Auto signOut + redirect `/login` (JWT expired or invalid) |
| 403 | ForbiddenPage (wrong userType or wrong property_group_id) |
| 402 | UpgradePlanBanner (subscription limit hit — plan limits) |
| 404 | Next.js `not-found.tsx` |
| 409 | Conflict (e.g. second ACTIVE lease on same unit) — toast + stay on form |
| Network error | `toast.error('Connection failed. Please try again.')` |
| Loading | LoadingSkeleton — never blank |
| Empty | EmptyState (icon, title, description, CTA) |

**API conventions (aligned with backend):** Base URL includes `/api` (e.g. `http://localhost:8000/api`). List responses: `GET /resource?page=1&limit=20` → `{ data: T[], meta: { page, limit, total } }`. Single resource: `{ data: T }`. Soft deletes: all GETs exclude `deleted_at` rows. Payment POST: send `Idempotency-Key: <uuid>` when initiating e-payment (future) to prevent double-charge.

**Security (frontend-relevant):** Access token 15min TTL; refresh token 7-day, rotated on use — implement refresh in Axios interceptor before 401. Never render `internalNotes` on any tenant-facing route. Rate-limited login: if backend returns 429 or lockout message, show user-friendly "Too many attempts" and countdown if available.

---

## 9. Build Phases

**8-week timeline · ~100+ tasks.** Phase 1 is the heaviest (foundation). All landlord data scoped to `/:pgId` with TanStack Query + query key factories.

### Alignment with backend (Architecture v2.1)

The **Implementation Roadmap** in the architecture doc has four system phases: **(1) Core Backend**, **(2) Dashboard UI & Add-ons**, **(3) E-Payment Integration**, **(4) Mobile App & Marketplace.** This frontend roadmap is the **web slice** of that plan:

| Frontend phase | Consumes backend | Notes |
|----------------|------------------|--------|
| P1 | API Phase 1 (Auth, PropertyGroups list) | Login, refresh, redirect; no landlord data yet |
| P2 | API Phase 1 (Properties, Units, Tenants) | Full CRUD; subscription limit checks (402) |
| P3 | API Phase 1 (Leases, Payments manual) | Lease wizard, manual cash recording, BillBreakdown |
| P4 | API Phase 2 (Admin, dashboards) + Phase 1 | Landlord overview KPIs; Admin dashboard; add-on catalog & meter readings when API ready |
| P5 | — | Polish, E2E, performance |
| Future | API Phase 3 (E-Payment) | "Pay online" → Dragonpay redirect; webhook drives PAID status |

**Add-ons & utilities (backend Phase 2):** When backend exposes add-on catalog, unit add-on assignment, and meter reading entry, frontend should add: Add-on catalog list/create (admin + landlord custom), Unit add-on assignment per unit, Meter reading entry form (previous/current reading → LeaseAddonBill), and BillBreakdown already shows addon line items from `GET /payments/:id` / lease addon bills.

### 8-week timeline overview

| Phase | Code | Title | Duration | Focus |
|-------|------|-------|----------|--------|
| 1 | P1 | Auth & Authorization | Week 1–2 | Identity, next-auth, layout |
| 2 | P2 | Landlord Core | Week 3–4 | Properties, Units, Tenants |
| 3 | P3 | Leases & Payments | Week 5–6 | Leases, payments, billing |
| 4 | P4 | Dashboards & Analytics | Week 7 | KPIs, charts, admin dashboard |
| 5 | P5 | Polish & Testing | Week 8 | E2E, performance, hardening |

---

### Phase 1 — Auth & Authorization

**Code:** P1 · **Duration:** Week 1–2 · **Status:** Current  
**Subtitle:** Foundation of identity  
**Stack:** next-auth v5, Axios interceptors, Zustand auth store, Zod schemas, shadcn/ui Form, Sonner toast  
**Note:** Web only: SYSTEM_ADMIN + LANDLORD. Tenant auth is mobile-only.

#### Auth flow

- User visits any URL → **next-auth middleware.ts** → Not logged in? → `/login`. Logged in: SYSTEM_ADMIN → `/dashboard`, LANDLORD → `/:pgId/overview`, TENANT → "Use mobile app" screen.

#### Task groups

**Project Setup**
- Init Next.js 15 (App Router, TypeScript, Tailwind, src/ dir)
- Configure ESLint + Prettier (eslint-config-next + TypeScript rules)
- Install & init shadcn/ui — Button, Input, Form, Card, Badge, Skeleton, Sheet, Dialog, Tabs, Separator, Tooltip, Dropdown
- Install: axios, zustand, react-hook-form, @hookform/resolvers, zod, sonner, lucide-react, date-fns, @tanstack/react-query, @tanstack/react-table, next-auth@beta
- Configure .env.local (NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- Configure tsconfig.json path aliases (@/*)
- Set up lib/api/client.ts — Axios instance skeleton

**Folder Structure**
- Create route groups: app/(auth)/, app/(admin)/, app/(landlord)/
- Create: components/ui/, components/layout/, components/common/, features/auth/, lib/api/, lib/validations/, stores/, types/
- Create types/domain.types.ts, types/api.types.ts, lib/constants.ts (ROUTES, API_URL, PLAN_LIMITS)

**Axios Client**
- baseURL + timeout; request interceptor (Bearer token); response: 401 → signOut + /login, normalize ApiError, 402 → upgrade, 403 → forbidden

**next-auth Configuration**
- lib/auth.config.ts — Credentials provider → POST /auth/login; JWT session (accessToken, refreshToken, user); session callback; app/api/auth/[...nextauth]/route.ts; middleware protect non-public, redirect by userType, LANDLORD /dashboard → /:pgId/overview

**Auth Zod Schemas**
- lib/validations/auth.schema.ts — loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema; export inferred types (LoginDto, RegisterDto, etc.)

**Auth API Functions**
- lib/api/auth.api.ts — login, register, forgotPassword, resetPassword, verifyEmail; lib/api/property-groups.api.ts — list (for post-login redirect)

**Zustand Auth Store**
- stores/auth.store.ts — user, isLoading, setUser, clearUser; hydrate from session; useAuth() with userType, isAdmin, isLandlord; stores/sidebar.store.ts

**Auth Pages & Components**
- app/(auth)/layout.tsx (centered card, logo, no sidebar); login, forgot-password, reset-password, verify-email, register pages + forms (RHF + schema); on login success → query property groups → redirect LANDLORD to /:pgId/overview, ADMIN to /dashboard

**Common Components**
- StatusBadge, EmptyState, LoadingSkeleton (Card/Table/Form), PageHeader, ConfirmDialog, ForbiddenPage, UpgradePlanBanner; lib/utils.ts — cn(), formatCurrency, formatDate, formatPeriod

**App Shell Layout**
- AppShell, Sidebar, TopBar, MobileNav; app/(admin)/layout.tsx, app/(landlord)/layout.tsx, app/(landlord)/[pgId]/layout.tsx (PropertyGroupProvider); app/layout.tsx — Providers (QueryClient, Session, Toaster)

**Testing & Quality**
- Vitest + Testing Library + user-event; unit tests for auth schemas and utils; manual E2E: landlord → /:pgId/overview, admin → /dashboard, unauthenticated → /login, TENANT → "use mobile app"

---

### Phase 2 — Landlord Core

**Code:** P2 · **Duration:** Week 3–4 · **Status:** Upcoming  
**Subtitle:** Properties, Units & Tenants  
**Stack:** TanStack Query, TanStack Table, shadcn SlideOver, React Hook Form, Zod schemas  
**Note:** Scoped to /:pgId. Query key factories for all data.

#### Task groups

**Property Group Selector**
- After login GET /property-groups → first active group; PropertyGroupProvider at [pgId]/layout; Sidebar: current group name + switcher; usePropertyGroup() — id, groupName, currencyCode, subscription

**Properties**
- propertyKeys factory; useProperties, useProperty, useCreateProperty, useUpdateProperty, useDeleteProperty; property.schema.ts; /:pgId/properties (PropertyGrid + unit count chips); /:pgId/properties/[propId] (detail + UnitGrid); PropertyForm in SlideOver; UnitGrid by UnitStatus; UnitDetailSlideOver, CreateUnitSlideOver

**Tenants**
- tenantKeys factory; useTenants, useTenant, useCreateTenant, useUpdateTenant; tenant.schema.ts; /:pgId/tenants (DataTable search + filters); /:pgId/tenants/[tenantId] (detail + lease history); TenantForm (firstName, lastName, phone, email, emergencyContact); InternalNotes landlord-only; BlacklistTenantDialog

---

### Phase 3 — Leases & Payments

**Code:** P3 · **Duration:** Week 5–6 · **Status:** Upcoming  
**Subtitle:** Core billing engine  
**Stack:** TanStack Table, multi-step wizard, Recharts, date-fns, SlideOver  
**Note:** Most complex — lease wizard + payment recording + bill breakdown.

#### Task groups

**Leases**
- leaseKeys factory; useLeases, useLease, useCreateLease, useCloseLease; lease.schema.ts; /:pgId/leases (tabs All/Active/Closed/Expired); /:pgId/leases/new (3-step wizard: Unit → Tenant → Terms); /:pgId/leases/[leaseId] (detail + payment timeline); CreateLeaseWizard (Zustand step state), LeaseTimeline, CloseLeaseDialog

**Payments**
- paymentKeys factory; usePayments, usePayment, useRecordPayment; payment.schema.ts; /:pgId/payments (filter status, date, tenant); /:pgId/payments/[paymentId] (bill breakdown + transactions); RecordPaymentSlideOver; BillBreakdown (base rent + addons); PaymentChart (Recharts bar, monthly totals)

---

### Phase 4 — Dashboards & Analytics

**Code:** P4 · **Duration:** Week 7 · **Status:** Upcoming  
**Subtitle:** Metrics for landlord + admin  
**Stack:** Recharts, TanStack Query, Server Components, MetricCard

#### Task groups

**Landlord Overview**
- /:pgId/overview — 4 KPI cards + charts + alerts; MetricCard (value + trend); OccupancyChart (donut); RecentPaymentsTable (last 10); OverdueAlertsList

**System Admin Dashboard**
- /dashboard (platform KPIs); /dashboard/landlords; /dashboard/subscriptions; /dashboard/settings; Admin-only guard on all /dashboard routes (UserRole ADMIN + UserType SYSTEM_ADMIN)

**Add-ons & Utilities (when backend Phase 2 ready)**
- GET /addon-catalog, POST /property-groups/:pgId/addon-catalog; unit add-on assignment (GET/POST/PATCH /units/:unitId/addons); meter reading entry (POST /unit-addons/:addonId/readings); BillBreakdown already shows LeaseAddonBill line items from payment/lease APIs

---

### Phase 5 — Polish & Testing

**Code:** P5 · **Duration:** Week 8 · **Status:** Upcoming  
**Subtitle:** Production-ready quality  
**Stack:** Vitest, Testing Library, Playwright, Lighthouse, ESLint audit

#### Task groups

**Testing**
- Playwright E2E: login → create lease → record payment; admin → landlords → subscriptions; Vitest: all Zod schemas + utils; Testing Library: LoginForm, CreateLeaseWizard steps

**Production Hardening**
- Error boundaries on route segments; skeleton loaders everywhere (no blank flash); mobile audit 375/768/1280; Lighthouse LCP < 2.5s; ESLint + TypeScript strict 0 errors; review: internalNotes never in tenant-facing route; HTTPS only, no secrets in client bundle

---

## 10. Bootstrap Commands

```bash
# 1. Create Next.js 15 app
npx create-next-app@latest renthub-frontend \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd renthub-frontend

# 2. Core dependencies
npm install @tanstack/react-query @tanstack/react-table axios zustand \
  react-hook-form @hookform/resolvers zod date-fns lucide-react sonner recharts

# 3. next-auth v5
npm install next-auth@beta

# 4. shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input label select textarea dialog sheet table badge card \
  skeleton dropdown-menu form separator tabs progress tooltip avatar popover command

# 5. Dev/testing
npm install -D vitest @testing-library/react @testing-library/user-event \
  @vitejs/plugin-react @playwright/test

# 6. Environment
# .env.local: NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

---

## 11. Definition of Done

### Per Page Checklist

- [ ] Data via TanStack Query hooks (no direct fetch/axios in components)
- [ ] Loading: LoadingSkeleton (not spinner or blank)
- [ ] Empty: EmptyState with CTA
- [ ] Errors: toast or inline message
- [ ] Forms: Zod schema + React Hook Form
- [ ] Responsive: 375px, 768px, 1280px
- [ ] TypeScript strict, no errors
- [ ] internalNotes never on tenant portal

### Per Feature Checklist

- [ ] Query keys: featureKeys.list/detail() factory
- [ ] Mutations: invalidateQueries on success
- [ ] Delete: ConfirmDialog
- [ ] Success: toast.success()
- [ ] 403 → ForbiddenPage, 402 → UpgradePlanBanner
- [ ] Routes protected by middleware
- [ ] Vitest for non-trivial logic
- [ ] API list responses: expect `{ data: T[], meta: { page, limit, total } }`; error shape `{ error: { code, message, details? } }`; base URL `/api`
- [ ] OrgRole: OWNER-only actions hidden or disabled for STAFF/ADMIN when known

### Architecture Decisions Summary

| Decision | Rationale |
|---|---|
| Route groups (auth), (landlord), (admin) | Clean URL separation, independent layouts |
| /:pgId in landlord URL | Bookmarkable, correct back-button, no global state for current group |
| TanStack Query for server state | Consistent loading/error/data, no useState for fetched data |
| Zustand for UI only | Sidebar, notifications — not server state |
| Single Axios instance | One place for JWT, 401, error shape |
| Zod as single source of truth | z.infer<> for types, no duplication |
| SlideOver for create/edit | User keeps list context |
| Server Components by default | Less JS, better performance |

---

## 12. References & Alignment

### Alignment with current backend (codebase)

The **backend** (`/backend`) is a NestJS app with Prisma and a global API prefix. Use this to wire the frontend to the live API.

**Base URL:** All endpoints are under the **`/api`** prefix (e.g. `NEXT_PUBLIC_API_URL=http://localhost:8000/api`). Swagger: `http://localhost:8000/docs`.

| Area | Backend implementation | Frontend use |
|------|------------------------|--------------|
| **Auth** | `POST /api/auth/register`, `login`, `refresh`, `logout`, `verify-email`, `forgot-password`, `reset-password` | next-auth Credentials provider → `POST /api/auth/login`; store `accessToken`, `refreshToken`, `user` (id, email, role, userType, isEmailVerified). Implement refresh via Axios interceptor. |
| **Login response** | `{ data: { accessToken, refreshToken, user: { id, email, role, userType, isEmailVerified } } }` | Session callback exposes `user.userType` for redirect (SYSTEM_ADMIN → /dashboard, LANDLORD → /:pgId/overview). |
| **Lockout** | Failed login attempts + `lockedUntil`; 401 with account-locked message | Show "Too many attempts" / countdown if backend returns 401 with that message. |
| **Property groups** | `GET/POST /api/property-groups`, `PATCH /api/property-groups/:id`, `GET/POST/PATCH/DELETE /api/property-groups/:id/members`, `GET /api/property-groups/:id/subscription` | After login, `GET /api/property-groups` → pick first for LANDLORD redirect. PropertyGroupProvider fetches by pgId. OWNER-only: PATCH group, add/remove/update members. |
| **Properties & units** | `GET/POST /api/property-groups/:pgId/properties`, `PATCH/DELETE /api/property-groups/:pgId/properties/:id`, `GET/POST /api/properties/:propId/units`, `PATCH/DELETE /api/units/:unitId` | propertyKeys, useProperties, useProperty, useCreateProperty, etc. DELETE property/unit is OWNER-only; 409 if OCCUPIED or ACTIVE lease. |
| **Tenants** | `GET/POST /api/property-groups/:pgId/tenants`, `GET/PATCH /api/property-groups/:pgId/tenants/:id` | tenantKeys, useTenants, useTenant, useCreateTenant, useUpdateTenant. No tenant invite endpoint yet (architecture Phase 2). |
| **Leases** | `POST/GET /api/property-groups/:pgId/leases`, `GET/PATCH /api/leases/:leaseId`, `POST /api/leases/:leaseId/close` | leaseKeys, useLeases, useLease, useCreateLease, useCloseLease. 409 if unit not available or already ACTIVE lease. |
| **Payments** | `GET /api/property-groups/:pgId/payments`, `GET /api/payments/:id`, `PATCH /api/payments/:id/manual` | paymentKeys, usePayments, usePayment, useRecordPayment. No e-payment initiate yet (architecture Phase 3). |
| **Admin (current)** | **No `/admin/*` routes.** Admin-only actions are under **`/api/users`**: `GET /api/users` (list), `GET /api/users/me`, `GET/PATCH /api/users/:id`, deactivate/activate/delete/restore — all guarded by `@Roles(UserRole.ADMIN)`. | For System Admin dashboard: use `GET /api/users` (paginated) and user management. **Dashboard KPIs, `/admin/property-groups`, `/admin/subscriptions`, `/admin/audit`** are from the architecture spec and are **not implemented in the backend yet**; add them when backend adds admin module or use users list as interim. |
| **Response shape** | Success: `{ data: T }`. Paginated list: `{ data: T[], meta: { page, limit, total } }` (ResponseInterceptor wraps; services return `{ data: items, meta }`). | Normalize in client: `response.data` for single resource; for lists use `data.data` and `data.meta` (page, limit, total). |
| **Error shape** | `{ error: { code, message, details? } }` (HttpExceptionFilter). Codes: BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, UNPROCESSABLE_ENTITY, PAYMENT_REQUIRED (402), TOO_MANY_REQUESTS. | Axios interceptor maps to `ApiError` (message, statusCode, errors[] from details). 402 → UpgradePlanBanner. |
| **Enums** | Prisma schema: UserRole, UserType, PropertyType, UnitType, UnitStatus, TenantStatus, LeaseType, LeaseStatus, PaymentStatus, PaymentMethod, SubscriptionStatus, AddonBillingType, etc. | `types/domain.types.ts` must match (e.g. from backend OpenAPI or shared package). |

**Not in backend yet (architecture / future):** `/admin/property-groups`, `/admin/subscriptions`, `/admin/audit`, `/admin/addon-catalog`; tenant invite `POST .../tenants/:id/invite`; e-payment `POST /payments/:id/initiate` and webhook; add-on catalog and meter reading endpoints. Frontend can prepare types and placeholder calls; implement UI when backend adds these.

---

| Document | Purpose |
|----------|---------|
| **RentHub System Architecture Specification v2.1** (`renthub-architecture-dashboard-v2.html`) | Single source of truth: Overview, Auth (UserRole + UserType), Database (20 tables, enums), API Spec (60+ endpoints), API Gameplan (phases 1–4), Security, Testing, Deployment, Implementation Roadmap. Frontend roadmap aligns with this. |
| **Backend (NestJS)** (`/backend`) | Live API: auth, property-groups, properties, tenants, leases, payments, users (admin). Global prefix `/api`; Swagger at `/docs`. |
| **Frontend gameplan** (if separate) | Page-by-page spec, component rules, folder structure — merged into this roadmap. |

**Critical integration flows (from Architecture Testing):** Login → Create Org → Add Property + Unit → Create Tenant → Create Lease → (Cron) Generate Bill → Confirm Payment. Add-on flow: Assign Add-on to Unit → Enter Meter Reading → Auto-create LeaseAddonBill → Tenant sees itemized bill. Frontend E2E should cover the first flow; add-on flow when backend Phase 2 is live.

**Security alignment:** No client-side role override; 403 on wrong property_group_id; internalNotes never to tenant; refresh token rotation; rate-limited login handling; secrets in env only.

### What to include (checklist)

Use this to confirm the roadmap covers everything from the architecture:

- [x] **Auth:** UserRole (ADMIN|USER) + UserType (SYSTEM_ADMIN|LANDLORD|TENANT); JWT + refresh; middleware redirect by userType
- [x] **OrgRole:** OWNER|ADMIN|STAFF for landlord portal; hide OWNER-only actions for non-OWNER
- [x] **Data scope:** All landlord data by property_group_id; PropertyGroup → Property → Unit → Lease → Payment
- [x] **Add-ons:** BillBreakdown = base rent + LeaseAddonBill; catalog, unit assignment, meter readings when API Phase 2 ready
- [x] **API alignment:** List shape `{ data: T[], meta: { page, limit, total } }` (backend); error `{ error: { code, message, details? } }`; 402/403 handling; base URL `/api`
- [x] **Backend triggers:** Lease activate/close, cron billing, meter reading, payment webhook → refetch/invalidate
- [x] **Security:** internalNotes never to tenant; refresh rotation; rate limit login UX; HTTPS, no secrets in client
- [x] **Testing:** E2E critical flow (login → org → property → unit → tenant → lease → payment); add-on flow when ready
- [ ] **E-Payment UI (future):** "Pay online" → Dragonpay redirect; Idempotency-Key; webhook drives PAID (API Phase 3)
- [ ] **Notifications (future):** Unread count, mark-read; optional in web when backend Phase 2 ready

---

## Summary notes

- **Web only:** Admin + Landlord; Tenant portal is a separate mobile app (Flutter).
- **Phase 1 is the heaviest:** Project setup, auth, layout, common components.
- **Zero tenant data on web:** internalNotes never in tenant-facing routes.
- **Query key factories:** propertyKeys, tenantKeys, leaseKeys, paymentKeys used in P2+.
- **Backend phases:** Frontend P1–P4 consume API Phase 1 (Core) and Phase 2 (Dashboard & Add-ons); E-Payment (Phase 3) and Mobile (Phase 4) are later.
