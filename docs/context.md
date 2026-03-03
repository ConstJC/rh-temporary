# RentHub — Cursor Context: Admin Portal (SYSTEM_ADMIN)
> Paste this entire file at the start of every new Cursor chat for admin work.
> Only update the `## Current Task` block before each session.

---

## What You Are Building

RentHub is a multi-tenant SaaS for Philippine landlords. The **Admin Portal**
is the platform operator's control center — accessed only by `SYSTEM_ADMIN`
users at `/dashboard/**`.

**Stack in play for this context:**
```
Frontend:  Next.js 15 · App Router · TypeScript strict
Styling:   Tailwind CSS 4 · shadcn/ui · primary color #1e3a5f
Data:      TanStack Query v5 · Axios
Forms:     React Hook Form + Zod
State:     Zustand (UI only)
Auth:      next-auth v5 (Auth.js)
Tables:    TanStack Table v8
Charts:    Recharts
Toasts:    Sonner
```

---

## Current Task

```
Feature  : Property Groups(Organization) 
Files    : src/app/(admin)/dashboard/page.tsx
Status   : Starting from scratch | Continuing | API ready
Notes    : Any special instructions or blockers
```

---

## Auth System — Read This First

RentHub uses a **two-layer auth model**. Every JWT contains both fields.

| Field | Values | Role |
|---|---|---|
| `role` | `ADMIN` \| `USER` | NestJS backend guard gate |
| `userType` | `SYSTEM_ADMIN` \| `LANDLORD` \| `TENANT` | Frontend routing layer |

**Admin user always has:** `role: ADMIN` + `userType: SYSTEM_ADMIN`

**Login response from `POST /auth/login`:**
```typescript
{
  accessToken: string       // JWT · 15 min TTL
  refreshToken: string      // DB-stored · 7 day TTL · rotated on use
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'ADMIN' | 'USER'
    userType: 'SYSTEM_ADMIN' | 'LANDLORD' | 'TENANT'
  }
}
```

**How middleware.ts uses this:**
```typescript
// src/middleware.ts
// userType SYSTEM_ADMIN → allowed in /dashboard/**
// userType LANDLORD     → allowed in /:pgId/**
// userType TENANT       → redirect to /mobile-only
// Not logged in         → redirect to /login
```

**`useAuth()` hook — what it returns:**
```typescript
const { user, isAdmin, isLandlord, isTenant, logout } = useAuth()
// import from src/hooks/useAuth.ts
```

---

## Admin Portal — 5 Features

All routes: `app/(admin)/dashboard/`. All guarded by `middleware.ts`.

### Feature 1 — Global Platform Dashboard
**Route:** `/dashboard` · **File:** `src/app/(admin)/dashboard/page.tsx`

The landing page after admin login. Shows platform health at a glance.

**What to display:**
```
Row 1 — 4 KPI cards:
  • Total Landlord Accounts  (count users where userType = LANDLORD)
  • Total Property Groups    (count all property groups)
  • Active Subscriptions     (count subscriptions where status = ACTIVE)
  • Platform Units           (sum of all units across all orgs)

Row 2 — 2 panels side by side:
  • Recent Signups           (last 10 landlord registrations — table)
  • Platform Activity        (last 20 audit log entries — feed)

Row 3 — Subscription Overview:
  • PlanBreakdownChart       (Recharts donut: STARTER / PRO / ENTERPRISE counts)
  • Expiring Soon alert      (count expiring within 7 days — banner if > 0)
```

**API calls for this page:**
```
GET /admin/property-groups?limit=5&sort=createdAt&order=desc  → recent orgs + total
GET /admin/users?userType=LANDLORD&limit=10&sort=createdAt    → recent landlords
GET /admin/subscriptions?limit=50                             → for plan breakdown chart
GET /admin/audit?limit=20                                     → activity feed
```

---

### Feature 2 — Manage Property Groups & Landlords
**Route:** `/dashboard/landlords` · **File:** `src/app/(admin)/dashboard/landlords/page.tsx`

Full list of all landlord organizations. Admin can view details and suspend/reactivate.

**What to display:**
```
• Search input (searches groupName + owner email)
• Status filter dropdown: All / Active / Suspended
• Paginated DataTable with columns:
    Organization Name | Owner Email | Plan | Sub Status | Units | Properties | Joined | Actions
• Row actions: "View Details" (SlideOver) · "Suspend" or "Reactivate" (ConfirmDialog)
• Detail SlideOver: groupName, owner info, member list, subscription info, counts
```

**API calls:**
```
GET   /admin/property-groups?page=&limit=20&search=&status=
PATCH /admin/property-groups/:id  → body: { status: 'ACTIVE' | 'SUSPENDED', notes?: string }
```

**Response shape `GET /admin/property-groups`:**
```typescript
{
  data: Array<{
    id: string
    groupName: string
    currencyCode: string           // "PHP"
    timezone: string               // "Asia/Manila"
    createdAt: string
    owner: {
      id: string
      email: string
      firstName: string
      lastName: string
      isActive: boolean
    }
    subscription: {
      planName: string             // "STARTER" | "PRO" | "ENTERPRISE"
      status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
      expiresAt: string | null
      maxUnits: number
      maxProperties: number
    }
    _count: {
      properties: number
      units: number
      members: number
    }
  }>
  meta: { total: number; page: number; limit: number }
}
```

---

### Feature 3 — Subscription Plans & Billing
**Route:** `/dashboard/subscriptions` · **File:** `src/app/(admin)/dashboard/subscriptions/page.tsx`

All org subscriptions. Plan distribution overview. Expiry management.

**What to display:**
```
• 4 stat tiles: Active | Trial | Expired | Expiring in 7 days
• PlanBreakdownChart (Recharts donut)
• ExpiryAlertBanner — only shown when count of expiring-in-7-days > 0
• Paginated DataTable with columns:
    Org Name | Plan | Price/mo | Status | Start Date | Expiry Date | Auto-renew | Actions
• Filter: Status dropdown · Plan dropdown
• Row actions: "View Details" (SlideOver)
```

**API calls:**
```
GET  /admin/subscriptions?page=&limit=20&status=&plan=
POST /admin/subscription-plans  → body: { name, priceMonthly, maxUnits, maxProperties }
```

**Response shape `GET /admin/subscriptions`:**
```typescript
{
  data: Array<{
    id: string
    status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
    startDate: string
    expiresAt: string | null
    autoRenew: boolean
    propertyGroup: {
      id: string
      groupName: string
      owner: { email: string; firstName: string; lastName: string }
    }
    plan: {
      id: string
      name: string                 // "STARTER" | "PRO" | "ENTERPRISE"
      priceMonthly: number
      maxUnits: number
      maxProperties: number
    }
  }>
  meta: { total: number; page: number; limit: number }
}
```

---

### Feature 4 — User Management, Roles & Permissions
**Route:** `/dashboard/users` · **File:** `src/app/(admin)/dashboard/users/page.tsx`

All platform users. Toggle active status. View account details.

**What to display:**
```
• Search input (searches email + name) — debounced 300ms
• UserType filter: All / SYSTEM_ADMIN / LANDLORD / TENANT
• Status filter: All / Active / Inactive / Unverified
• Paginated DataTable with columns:
    Name | Email | UserType | Status | Email Verified | Joined | Actions
• Row actions: "View Details" (SlideOver) · "Disable" or "Enable" (ConfirmDialog)
• Guard: disable action hidden if user.id === currentUser.id (can't self-disable)
```

**API calls:**
```
GET   /admin/users?page=&limit=20&userType=&isActive=&search=
PATCH /admin/users/:id  → body: { isActive?: boolean, userType?: UserType }
```

**Response shape `GET /admin/users`:**
```typescript
{
  data: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'ADMIN' | 'USER'
    userType: 'SYSTEM_ADMIN' | 'LANDLORD' | 'TENANT'
    isActive: boolean
    isEmailVerified: boolean
    phone: string | null
    createdAt: string
    lastLoginAt: string | null
    _count: { propertyGroups: number }
  }>
  meta: { total: number; page: number; limit: number }
}
```

**⛔ NEVER render in any component:** `password` · `resetPasswordToken` ·
`emailVerificationToken` · `failedLoginAttempts`

---

### Feature 5 — Audit Trail & Platform Reports
**Route:** `/dashboard/audit` · **File:** `src/app/(admin)/dashboard/audit/page.tsx`

Immutable forensic log of all platform-wide actions. Read-only.

**What to display:**
```
• Filter bar: Table name dropdown | Action type | User search | Date from | Date to
• Paginated dense DataTable with columns:
    Action | Table | Performed By | Record ID | IP Address | Timestamp
• Row click: opens AuditDetailSlideOver showing old values vs new values diff
• Action badges: INSERT (green) · UPDATE (blue) · DELETE (red)
• No edit or delete on this page — the audit log is append-only
```

**API call:**
```
GET /admin/audit?page=&limit=50&tableName=&userId=&action=&dateFrom=&dateTo=
```

**Response shape `GET /admin/audit`:**
```typescript
{
  data: Array<{
    id: string
    tableName: string              // "leases" | "payments" | "users" | "tenants" | etc.
    recordId: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    oldValues: Record<string, unknown> | null
    newValues: Record<string, unknown> | null
    performedBy: {
      id: string
      email: string
      userType: string
    } | null                       // null = system/cron action
    ipAddress: string | null
    requestId: string | null
    createdAt: string
  }>
  meta: { total: number; page: number; limit: number }
}
```

---

## Exact Folder Structure

```
src/
├── app/
│   └── (admin)/
│       ├── layout.tsx                              ← Admin AppShell wrapper
│       └── dashboard/
│           ├── page.tsx                            ← Feature 1: KPI dashboard
│           ├── landlords/page.tsx                  ← Feature 2: Property groups
│           ├── subscriptions/page.tsx              ← Feature 3: Subscriptions
│           ├── users/page.tsx                      ← Feature 4: User management
│           └── audit/page.tsx                      ← Feature 5: Audit trail
│
├── features/
│   └── admin/
│       ├── hooks/
│       │   ├── useAdminDashboard.ts
│       │   ├── usePropertyGroups.ts
│       │   ├── useAdminSubscriptions.ts
│       │   ├── useAdminUsers.ts
│       │   └── useAuditLog.ts
│       ├── dashboard/
│       │   ├── KpiCard.tsx
│       │   ├── RecentSignupsTable.tsx
│       │   ├── ActivityFeed.tsx
│       │   └── PlanBreakdownChart.tsx
│       ├── landlords/
│       │   ├── LandlordsTable.tsx
│       │   ├── LandlordsTableColumns.tsx
│       │   ├── PropertyGroupDetailSlideOver.tsx
│       │   └── SuspendOrgDialog.tsx
│       ├── subscriptions/
│       │   ├── SubscriptionsTable.tsx
│       │   ├── SubscriptionsTableColumns.tsx
│       │   ├── PlanBreakdownChart.tsx
│       │   └── ExpiryAlertBanner.tsx
│       ├── users/
│       │   ├── UsersTable.tsx
│       │   ├── UsersTableColumns.tsx
│       │   ├── UserDetailSlideOver.tsx
│       │   └── ToggleUserStatusDialog.tsx
│       └── audit/
│           ├── AuditLogTable.tsx
│           ├── AuditLogTableColumns.tsx
│           ├── AuditDetailSlideOver.tsx
│           └── AuditFilters.tsx
│
├── lib/
│   └── api/
│       └── admin.api.ts                            ← ALL admin HTTP calls — here only
│
└── types/
    └── domain.types.ts                             ← Add admin types here
```

---

## `admin.api.ts` — Create This File First

Every admin component imports from here. **Never call `apiClient` directly
in a component or page.**

```typescript
// src/lib/api/admin.api.ts
import { apiClient } from './client'
import type {
  AdminPropertyGroup,
  AdminSubscription,
  AdminUser,
  AuditLogEntry,
  PaginatedResponse,
} from '@/types/domain.types'

// ── Param types ──────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PropertyGroupFilters extends PaginationParams {
  search?: string
  status?: 'ACTIVE' | 'SUSPENDED'
}

export interface SubscriptionFilters extends PaginationParams {
  status?: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
  plan?: string
}

export interface UserFilters extends PaginationParams {
  userType?: 'SYSTEM_ADMIN' | 'LANDLORD' | 'TENANT'
  isActive?: boolean
  search?: string
}

export interface AuditFilters extends PaginationParams {
  tableName?: string
  userId?: string
  action?: 'INSERT' | 'UPDATE' | 'DELETE'
  dateFrom?: string
  dateTo?: string
}

// ── Admin API object ─────────────────────────────────────────────────────

export const adminApi = {

  // Feature 2 — Property Groups
  getPropertyGroups: (filters: PropertyGroupFilters) =>
    apiClient
      .get<PaginatedResponse<AdminPropertyGroup>>('/admin/property-groups', { params: filters })
      .then(r => r.data),

  updatePropertyGroup: (id: string, data: { status?: string; notes?: string }) =>
    apiClient.patch(`/admin/property-groups/${id}`, data).then(r => r.data),

  // Feature 3 — Subscriptions
  getSubscriptions: (filters: SubscriptionFilters) =>
    apiClient
      .get<PaginatedResponse<AdminSubscription>>('/admin/subscriptions', { params: filters })
      .then(r => r.data),

  createSubscriptionPlan: (data: {
    name: string
    priceMonthly: number
    maxUnits: number
    maxProperties: number
  }) => apiClient.post('/admin/subscription-plans', data).then(r => r.data),

  // Feature 4 — Users
  getUsers: (filters: UserFilters) =>
    apiClient
      .get<PaginatedResponse<AdminUser>>('/admin/users', { params: filters })
      .then(r => r.data),

  updateUser: (id: string, data: { isActive?: boolean; userType?: string }) =>
    apiClient.patch(`/admin/users/${id}`, data).then(r => r.data),

  // Feature 5 — Audit log
  getAuditLog: (filters: AuditFilters) =>
    apiClient
      .get<PaginatedResponse<AuditLogEntry>>('/admin/audit', { params: filters })
      .then(r => r.data),
}
```

---

## TanStack Query Hooks — Pattern & All 5 Files

**Pattern rule:** Every hook file exports a key factory + `useQuery` hooks +
`useMutation` hooks. Pages and components only import from hooks — never
call `adminApi` directly.

### `useAdminUsers.ts` (reference — build all others the same way)

```typescript
// src/features/admin/hooks/useAdminUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi, type UserFilters } from '@/lib/api/admin.api'

// ── Key factory ──────────────────────────────────────────────────────────
export const adminUserKeys = {
  all:    ()                      => ['adminUsers']           as const,
  list:   (f: UserFilters)        => ['adminUsers', 'list', f] as const,
}

// ── Queries ──────────────────────────────────────────────────────────────
export function useAdminUsers(filters: UserFilters) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn:  () => adminApi.getUsers(filters),
    staleTime: 30_000,
    placeholderData: prev => prev,   // keeps previous data while refetching
  })
}

// ── Mutations ────────────────────────────────────────────────────────────
export function useToggleUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUser(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.all() })
      toast.success(isActive ? 'Account enabled' : 'Account disabled')
    },
    onError: () => toast.error('Failed to update user status'),
  })
}

export function useUpdateUserType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userType }: { id: string; userType: string }) =>
      adminApi.updateUser(id, { userType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUserKeys.all() })
      toast.success('User type updated')
    },
    onError: () => toast.error('Failed to update user type'),
  })
}
```

**Replicate this exact pattern for the other 4 hooks:**

| File | Key factory name | Api functions to wrap |
|---|---|---|
| `usePropertyGroups.ts` | `adminPropertyGroupKeys` | `getPropertyGroups`, `updatePropertyGroup` |
| `useAdminSubscriptions.ts` | `adminSubscriptionKeys` | `getSubscriptions`, `createSubscriptionPlan` |
| `useAdminDashboard.ts` | `adminDashboardKeys` | `getPropertyGroups`, `getUsers`, `getSubscriptions`, `getAuditLog` |
| `useAuditLog.ts` | `auditLogKeys` | `getAuditLog` |

---

## TypeScript Domain Types

Add these to `src/types/domain.types.ts`. **Do not redefine them inline.**

```typescript
// ── Shared ───────────────────────────────────────────────────────────────

export type UserRole    = 'ADMIN' | 'USER'
export type UserType    = 'SYSTEM_ADMIN' | 'LANDLORD' | 'TENANT'
export type SubStatus   = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number }
}

// ── Admin types ──────────────────────────────────────────────────────────

export interface AdminPropertyGroup {
  id: string
  groupName: string
  currencyCode: string
  timezone: string
  createdAt: string
  owner: {
    id: string
    email: string
    firstName: string
    lastName: string
    isActive: boolean
  }
  subscription: {
    planName: string
    status: SubStatus
    expiresAt: string | null
    maxUnits: number
    maxProperties: number
  }
  _count: { properties: number; units: number; members: number }
}

export interface AdminSubscription {
  id: string
  status: SubStatus
  startDate: string
  expiresAt: string | null
  autoRenew: boolean
  propertyGroup: {
    id: string
    groupName: string
    owner: { email: string; firstName: string; lastName: string }
  }
  plan: {
    id: string
    name: string
    priceMonthly: number
    maxUnits: number
    maxProperties: number
  }
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  userType: UserType
  isActive: boolean
  isEmailVerified: boolean
  phone: string | null
  createdAt: string
  lastLoginAt: string | null
  _count: { propertyGroups: number }
}

export interface AuditLogEntry {
  id: string
  tableName: string
  recordId: string
  action: AuditAction
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  performedBy: { id: string; email: string; userType: string } | null
  ipAddress: string | null
  requestId: string | null
  createdAt: string
}
```

---

## Status Badge Color Map

Use these exact Tailwind classes. Import from `src/components/common/StatusBadge.tsx`.
**Never write ad-hoc badge styles inline.**

```typescript
// Add these to statusMap inside StatusBadge.tsx

// User account status
USER_ACTIVE:       'bg-success-100 text-success-700 border-success-200'
USER_INACTIVE:     'bg-slate-100   text-slate-500   border-slate-200'
USER_UNVERIFIED:   'bg-warning-100 text-warning-700 border-warning-200'

// User type
SYSTEM_ADMIN:      'bg-primary-100 text-primary-700 border-primary-200'
LANDLORD:          'bg-accent-100  text-accent-600  border-accent-200'
TENANT:            'bg-success-100 text-success-700 border-success-200'

// Subscription status
SUB_ACTIVE:        'bg-success-100 text-success-700 border-success-200'
SUB_TRIAL:         'bg-accent-100  text-accent-600  border-accent-200'
SUB_EXPIRED:       'bg-danger-100  text-danger-700  border-danger-200'
SUB_CANCELLED:     'bg-slate-100   text-slate-500   border-slate-200'

// Audit actions
AUDIT_INSERT:      'bg-success-100 text-success-700 border-success-200'
AUDIT_UPDATE:      'bg-accent-100  text-accent-600  border-accent-200'
AUDIT_DELETE:      'bg-danger-100  text-danger-700  border-danger-200'
```

---

## Admin Sidebar Nav

```typescript
// Used in src/app/(admin)/layout.tsx

export const adminNavItems = [
  { label: 'Dashboard',     href: '/dashboard',               icon: 'LayoutDashboard' },
  { label: 'Landlords',     href: '/dashboard/landlords',     icon: 'Building2'       },
  { label: 'Subscriptions', href: '/dashboard/subscriptions', icon: 'CreditCard'      },
  { label: 'Users',         href: '/dashboard/users',         icon: 'Users'           },
  { label: 'Audit Trail',   href: '/dashboard/audit',         icon: 'ClipboardList'   },
]
// All icons from lucide-react
```

---

## Build Order

Do **not** skip steps. Each phase depends on the one before it.

```
── Phase A: Foundation ─────────────────────────────────────────────────────

  Step 1   src/types/domain.types.ts
           → Add all admin types listed above. Verify no TypeScript errors.

  Step 2   src/lib/api/admin.api.ts
           → Full file exactly as shown in this context. No shortcuts.

  Step 3   src/features/admin/hooks/useAdminUsers.ts
  Step 4   src/features/admin/hooks/usePropertyGroups.ts
  Step 5   src/features/admin/hooks/useAdminSubscriptions.ts
  Step 6   src/features/admin/hooks/useAuditLog.ts
  Step 7   src/features/admin/hooks/useAdminDashboard.ts

── Phase B: Feature 4 — Users (build this first, simplest CRUD) ────────────

  Step 8   src/features/admin/users/UsersTableColumns.tsx
  Step 9   src/features/admin/users/UsersTable.tsx
  Step 10  src/features/admin/users/UserDetailSlideOver.tsx
  Step 11  src/features/admin/users/ToggleUserStatusDialog.tsx
  Step 12  src/app/(admin)/dashboard/users/page.tsx

── Phase C: Feature 2 — Landlords ─────────────────────────────────────────

  Step 13  src/features/admin/landlords/LandlordsTableColumns.tsx
  Step 14  src/features/admin/landlords/LandlordsTable.tsx
  Step 15  src/features/admin/landlords/PropertyGroupDetailSlideOver.tsx
  Step 16  src/features/admin/landlords/SuspendOrgDialog.tsx
  Step 17  src/app/(admin)/dashboard/landlords/page.tsx

── Phase D: Feature 3 — Subscriptions ─────────────────────────────────────

  Step 18  src/features/admin/subscriptions/SubscriptionsTableColumns.tsx
  Step 19  src/features/admin/subscriptions/SubscriptionsTable.tsx
  Step 20  src/features/admin/subscriptions/PlanBreakdownChart.tsx
  Step 21  src/features/admin/subscriptions/ExpiryAlertBanner.tsx
  Step 22  src/app/(admin)/dashboard/subscriptions/page.tsx

── Phase E: Feature 5 — Audit Trail ────────────────────────────────────────

  Step 23  src/features/admin/audit/AuditLogTableColumns.tsx
  Step 24  src/features/admin/audit/AuditFilters.tsx
  Step 25  src/features/admin/audit/AuditDetailSlideOver.tsx
  Step 26  src/features/admin/audit/AuditLogTable.tsx
  Step 27  src/app/(admin)/dashboard/audit/page.tsx

── Phase F: Feature 1 — Dashboard (last — needs all data) ──────────────────

  Step 28  src/features/admin/dashboard/KpiCard.tsx
  Step 29  src/features/admin/dashboard/RecentSignupsTable.tsx
  Step 30  src/features/admin/dashboard/ActivityFeed.tsx
  Step 31  src/features/admin/dashboard/PlanBreakdownChart.tsx
  Step 32  src/app/(admin)/dashboard/page.tsx
```

---

## Non-Negotiable Rules

```
✕ NEVER render: password · resetPasswordToken · emailVerificationToken · failedLoginAttempts
✕ NEVER call apiClient directly in a page or component — always go through adminApi
✕ NEVER use useState to store API data — useQuery handles all server state
✕ NEVER put 'use client' on page.tsx files — pages are Server Components
✕ NEVER skip ConfirmDialog for destructive actions (disable account, suspend org)
✕ NEVER hardcode hex colors or use bg-[#hex] — use Tailwind palette classes only
✕ NEVER allow admin to disable their own account
   → guard: hide disable action when user.id === currentUser.id

✓ Loading state   → always render <TableSkeleton /> — never a raw spinner div
✓ Empty state     → always render <EmptyState /> — never blank or raw text
✓ Search inputs   → debounce 300ms with useDebounce() before triggering query
✓ Pagination      → use usePagination() hook — changes update the query key
✓ Mutations       → disable submit button + show loading while isPending
✓ Dates           → format with formatDate() from src/lib/utils.ts
✓ Currency        → format with formatCurrency() from src/lib/utils.ts
✓ Error handling  → onError in useMutation calls toast.error() only — no console.log
✓ Query keys      → always include all filter params so cache is per-filter
```

---

## Copy-Paste Prompt Templates

Use one of these to start each Cursor session. Fill in the blanks.

---

### To create `admin.api.ts`

```
Task: Create the admin API module
File: src/lib/api/admin.api.ts

Create the full file exactly as defined in CONTEXT-admin-portal.md.

Import apiClient from src/lib/api/client.ts
Import types from src/types/domain.types.ts

Do not use raw fetch().
Do not add try/catch — errors bubble to the Axios response interceptor.
Do not add any functions not listed in the context file.
```

---

### To create a query hook

```
Task: Create TanStack Query hooks for admin [feature name]
File: src/features/admin/hooks/use[FeatureName].ts

Create:
  - [featureName]Keys factory with: all(), list(filters)
  - use[FeatureName](filters) hook → useQuery wrapping adminApi.[getFn]
  - use[ActionName]() mutation → useMutation wrapping adminApi.[mutationFn]
    → on success: invalidate [featureName]Keys.all() + toast.success('[message]')
    → on error: toast.error('Failed to [action]')

Import adminApi from src/lib/api/admin.api.ts
Import types from src/types/domain.types.ts

Follow CONTEXT-admin-portal.md hook pattern exactly.
Do not call apiClient directly.
Do not use useState.
```

---

### To create a DataTable + Columns

```
Task: Create the [FeatureName] data table and column definitions
Files:
  - src/features/admin/[feature]/[Feature]TableColumns.tsx
  - src/features/admin/[feature]/[Feature]Table.tsx

Columns: [list exact columns from the feature spec above]

[Feature]TableColumns.tsx:
  - Export a function that returns ColumnDef<[Type]>[]
  - Badge columns: use StatusBadge from src/components/common/StatusBadge.tsx
  - Date columns: use formatDate() from src/lib/utils.ts
  - Actions column: DropdownMenu (shadcn) with items: [list actions]

[Feature]Table.tsx:
  - 'use client'
  - Use use[FeatureName](filters) from hooks file
  - Use usePagination() from src/hooks/usePagination.ts
  - Use useDebounce(search, 300) from src/hooks/useDebounce.ts
  - Loading: <TableSkeleton />
  - Empty: <EmptyState title="No [items] found" />
  - Render <DataTable columns={columns} data={data} />
  - Render <DataTablePagination /> below table

Import DataTable from src/components/tables/DataTable.tsx
Do not define columns inline inside the Table component.
Do not use useState for fetched data.
```

---

### To create a page

```
Task: Create the [Feature Name] admin page
File: src/app/(admin)/dashboard/[route]/page.tsx

This is a Server Component — no 'use client'.

Render:
  <PageHeader title="[Title]" description="[Description]" />
  <[FeatureTable] />   ← client component from features/admin/[feature]/

All data fetching happens inside the client component via hooks.
This page file must stay under 20 lines.
Do not fetch data here.
Do not import hooks directly in this file.
```

---

### To create a SlideOver (read-only detail panel)

```
Task: Create the [Entity] detail SlideOver
File: src/features/admin/[feature]/[Entity]DetailSlideOver.tsx

'use client'

Props: { [entity]: [Type] | null; open: boolean; onClose: () => void }

Show these fields: [list exact fields from feature spec above]

Rules:
  - Read-only — no edit functionality in this component
  - Use SlideOver from src/components/common/SlideOver.tsx
  - Use StatusBadge from src/components/common/StatusBadge.tsx
  - Use formatDate() from src/lib/utils.ts for all date fields
  - Use formatCurrency() from src/lib/utils.ts for all money fields
  - Do NOT render: [list forbidden fields from the feature spec]
```

---

### To create a ConfirmDialog (destructive action)

```
Task: Create the [Action] confirm dialog
File: src/features/admin/[feature]/[Action]Dialog.tsx

'use client'

Props: { [entity]: [Type] | null; open: boolean; onClose: () => void }

Use use[MutationHook]() from src/features/admin/hooks/use[Feature].ts

Dialog text:
  - Title: "[Action title]"
  - Description: "[Consequence explanation with entity name]"
  - Confirm button: [label] · variant=[destructive|default] · disabled when isPending
  - Cancel button: always enabled

On confirm: call mutation with { id: [entity].id, ... }
On success: the hook's onSuccess calls toast + invalidates cache
After confirm: call onClose()

Import ConfirmDialog from src/components/common/ConfirmDialog.tsx
[Add any guards from the feature spec — e.g. self-disable protection]
```

---

## If the API Is Not Ready

Add this line to your prompt:

```
The backend API is not yet ready.
Use mock data matching the exact response shapes in CONTEXT-admin-portal.md.
Wrap mock data in a 600ms setTimeout inside the queryFn to simulate loading.
Keep the hook interface identical — when the real API is ready,
only the queryFn body needs to change.
```

---

## Definition of Done — Per Admin Page

A page is complete when all of the following are true:

```
□ All data loaded via TanStack Query — zero raw fetch or axios in components
□ TableSkeleton renders during loading — no blank flash
□ EmptyState renders when query returns zero results
□ All status values use StatusBadge — no raw text or ad-hoc colors
□ Search inputs debounce 300ms before updating query key
□ Pagination updates query key and shows correct total
□ Destructive actions (disable, suspend) require ConfirmDialog
□ ConfirmDialog submit button disabled + spinner while mutation.isPending
□ Toast shows on mutation success and mutation error
□ Zero TypeScript errors in strict mode
□ Zero `any` types
□ Zero bg-[#hex] or inline hex color styles
□ Forbidden fields (password, tokens) not referenced anywhere
□ Self-disable guard in place (Feature 4 users page)
□ Audit log table is read-only — no actions column
```