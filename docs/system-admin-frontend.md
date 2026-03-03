# RentHub — System Admin Frontend Gameplan

**Portal:** System Admin (Web)
**Framework:** Next.js 15 · App Router · TypeScript strict
**Base Route:** `app/(admin)/`
**Auth:** `role = ADMIN` + `userType = SYSTEM_ADMIN` — enforced by `middleware.ts` only

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Routing & Auth Guard](#2-routing--auth-guard)
3. [Shared Infrastructure to Build First](#3-shared-infrastructure-to-build-first)
4. [Page Implementation Plans](#4-page-implementation-plans)
   - [4.1 Auth Pages](#41-auth-pages)
   - [4.2 Dashboard](#42-dashboard-admindashboard)
   - [4.3 Property Groups](#43-property-groups-adminproperty-groups)
   - [4.4 Users](#44-users-adminusers)
   - [4.5 Subscriptions](#45-subscriptions-adminsubscriptions)
   - [4.6 Add-on Catalog](#46-add-on-catalog-adminaddons)
   - [4.7 Audit Trail](#47-audit-trail-adminaudit)
5. [API Layer](#5-api-layer)
6. [Zod Schemas](#6-zod-schemas)
7. [TanStack Query Hooks](#7-tanstack-query-hooks)
8. [Design System Reference](#8-design-system-reference)
9. [Build Order & Checklist](#9-build-order--checklist)

---

## 1. Folder Structure

Only the files relevant to the admin portal. Everything follows the architecture v3 conventions.

```
src/
│
├── app/
│   ├── (auth)/                          # Public — no sidebar
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx                   # Centered card layout
│   │
│   └── (admin)/                         # SYSTEM_ADMIN only — guarded by middleware.ts
│       ├── layout.tsx                   # Admin AppShell (sidebar + topbar)
│       └── dashboard/
│           ├── page.tsx                 # KPI overview
│           ├── property-groups/
│           │   ├── page.tsx             # All orgs table
│           │   └── [id]/
│           │       └── page.tsx         # Org detail
│           ├── users/
│           │   └── page.tsx             # All users table
│           ├── subscriptions/
│           │   └── page.tsx             # Subscription control
│           ├── addons/
│           │   └── page.tsx             # Platform add-on catalog
│           └── audit/
│               └── page.tsx             # Audit trail
│
├── features/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   │
│   └── admin/                           # All admin-specific feature components
│       ├── dashboard/
│       │   ├── KpiCard.tsx
│       │   ├── SubscriptionsByPlanChart.tsx
│       │   ├── RevenueChart.tsx
│       │   └── OrgRegistrationsChart.tsx
│       ├── property-groups/
│       │   ├── PropertyGroupsTable.tsx
│       │   ├── PropertyGroupDetailSheet.tsx
│       │   ├── SuspendOrgDialog.tsx
│       │   └── OverridePlanDialog.tsx
│       ├── users/
│       │   ├── UsersTable.tsx
│       │   ├── UserDetailSheet.tsx
│       │   └── ChangeUserTypeDialog.tsx
│       ├── subscriptions/
│       │   ├── SubscriptionsTable.tsx
│       │   └── ExtendSubscriptionDialog.tsx
│       ├── addons/
│       │   ├── AddonCatalogTable.tsx
│       │   ├── AddonForm.tsx            # Used for create + edit (Sheet)
│       │   └── DeleteAddonDialog.tsx
│       └── audit/
│           ├── AuditTable.tsx
│           ├── AuditFilters.tsx
│           └── AuditDiffViewer.tsx      # Old value → New value JSON diff
│
├── lib/
│   ├── api/
│   │   ├── client.ts                    # Axios instance + interceptors (shared)
│   │   ├── auth.api.ts                  # login, forgotPassword, resetPassword
│   │   └── admin.api.ts                 # All /admin/* calls
│   │
│   └── validations/
│       ├── auth.schema.ts               # loginSchema, forgotPasswordSchema, resetPasswordSchema
│       └── admin.schema.ts              # addonSchema, overridePlanSchema, extendSubSchema
│
├── features/admin/hooks/                # TanStack Query hooks — admin feature
│   ├── useAdminDashboard.ts
│   ├── useAdminPropertyGroups.ts
│   ├── useAdminUsers.ts
│   ├── useAdminSubscriptions.ts
│   ├── useAdminAddons.ts
│   └── useAdminAudit.ts
│
└── types/
    └── domain.types.ts                  # PropertyGroup, User, Subscription, AddonCatalog, AuditTrail
```

**Rules:**
- `app/(admin)/` route group is protected globally by `middleware.ts` — no auth checks inside pages
- All feature components live in `src/features/admin/[section]/` — never inline in page files
- Pages are thin: import feature components, pass props, done
- `'use client'` only on components that use hooks or events — never on `page.tsx` files

---

## 2. Routing & Auth Guard

### `src/middleware.ts` (relevant admin block)

```typescript
// Route protection — SYSTEM_ADMIN only for (admin) routes
if (pathname.startsWith('/dashboard')) {
  if (!token) return NextResponse.redirect(new URL('/login', req.url))
  if (token.userType === 'TENANT') return NextResponse.redirect(new URL('/mobile-only', req.url))
  if (token.userType === 'LANDLORD') return NextResponse.redirect(new URL(`/${token.defaultPgId}/overview`, req.url))
  // SYSTEM_ADMIN falls through → allowed
}
```

### `app/(auth)/layout.tsx` — Auth shell (no sidebar)

```tsx
// Server Component — no 'use client'
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-primary-700">RentHub</span>
          <p className="text-slate-500 text-sm mt-1">Admin Portal</p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

### `app/(admin)/layout.tsx` — Admin AppShell

```tsx
// Server Component
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { TopBar } from '@/components/layout/TopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Admin Sidebar nav items

```typescript
// src/lib/constants.ts
export const ADMIN_NAV = [
  { label: 'Dashboard',        href: '/dashboard',                    icon: 'LayoutDashboard' },
  { label: 'Property Groups',  href: '/dashboard/property-groups',    icon: 'Building2' },
  { label: 'Users',            href: '/dashboard/users',              icon: 'Users' },
  { label: 'Subscriptions',    href: '/dashboard/subscriptions',      icon: 'CreditCard' },
  { label: 'Add-on Catalog',   href: '/dashboard/addons',             icon: 'Puzzle' },
  { label: 'Audit Trail',      href: '/dashboard/audit',              icon: 'ScrollText' },
] as const
```

---

## 3. Shared Infrastructure to Build First

Before writing any feature component, these must exist.

### 3.1 `src/lib/api/client.ts`

```typescript
import axios from 'axios'
import { toast } from 'sonner'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT
apiClient.interceptors.request.use((config) => {
  const token = /* getSession from next-auth */ ''
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize errors
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.error?.message ?? 'Something went wrong'
    if (status === 401) { /* trigger logout */ }
    if (status === 403) toast.error('Access denied')
    return Promise.reject(new Error(message))
  }
)
```

### 3.2 Common components required by all admin pages

| Component | Location | Purpose |
|---|---|---|
| `StatusBadge` | `src/components/common/StatusBadge.tsx` | All status enums — never hardcode badge colors |
| `PageHeader` | `src/components/common/PageHeader.tsx` | Title + description + optional right-side action |
| `DataTable` | `src/components/tables/DataTable.tsx` | TanStack Table v8 wrapper |
| `DataTablePagination` | `src/components/tables/DataTablePagination.tsx` | Page controls |
| `DataTableFilters` | `src/components/tables/DataTableFilters.tsx` | Search + filter bar |
| `LoadingSkeleton` | `src/components/common/LoadingSkeleton.tsx` | Table and card skeleton variants |
| `EmptyState` | `src/components/common/EmptyState.tsx` | No results, empty table |
| `ConfirmDialog` | `src/components/common/ConfirmDialog.tsx` | All destructive actions — suspend, delete |

### 3.3 `src/types/domain.types.ts` — admin-relevant types

```typescript
export type UserRole = 'ADMIN' | 'USER'
export type UserType = 'SYSTEM_ADMIN' | 'LANDLORD' | 'TENANT'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'GRACE_PERIOD' | 'CANCELLED'
export type AddonBillingType = 'FIXED_AMENITY' | 'FLAT_FEE' | 'METERED'
export type OrgStatus = 'ACTIVE' | 'SUSPENDED'

export interface AdminPropertyGroup {
  id: string
  groupName: string
  ownerEmail: string
  status: OrgStatus
  subscriptionPlan: string
  subscriptionStatus: SubscriptionStatus
  memberCount: number
  unitCount: number
  createdAt: string
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
  createdAt: string
  lastLoginAt: string | null
}

export interface AdminSubscription {
  id: string
  propertyGroupId: string
  groupName: string
  plan: string
  status: SubscriptionStatus
  currentPeriodEnd: string
  unitCount: number
}

export interface AddonCatalog {
  id: string
  name: string
  category: string
  billingType: AddonBillingType
  unitOfMeasure: string | null
  defaultRate: number | null
  isActive: boolean
  propertyGroupId: string | null   // null = platform-wide
}

export interface AuditEntry {
  id: string
  userId: string
  userEmail: string
  tableName: string
  recordId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}
```

---

## 4. Page Implementation Plans

### 4.1 Auth Pages

#### Design: Clean centered card, no distractions

All three auth pages share the `(auth)/layout.tsx` shell — white card on `slate-100` background. Uses shadcn `Card`, `Input`, `Button`, `Label`. No sidebar, no topbar.

---

#### `app/(auth)/login/page.tsx`

```tsx
// Server Component — no 'use client'
import { LoginForm } from '@/features/auth/LoginForm'

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-900">Sign in</CardTitle>
        <CardDescription className="text-slate-500">
          Admin access only. Enter your credentials below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
```

#### `src/features/auth/LoginForm.tsx`

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginDto } from '@/lib/validations/auth.schema'
import { useLoginMutation } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
  })
  const { mutate: login, isPending } = useLoginMutation()

  return (
    <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="admin@renthub.ph" {...register('email')} />
        {errors.email && <p className="text-xs text-danger-600">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <p className="text-xs text-danger-600">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>
      <p className="text-center text-sm">
        <a href="/forgot-password" className="text-accent-500 hover:text-accent-600 text-sm">
          Forgot password?
        </a>
      </p>
    </form>
  )
}
```

**Zod schema — `src/lib/validations/auth.schema.ts`:**
```typescript
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginDto = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
```

---

### 4.2 Dashboard — `/admin/dashboard`

#### Design intent
4 KPI cards in a grid. Below: 2-column layout with a revenue trend chart (left, wider) and a subscriptions-by-plan donut (right). Clean white cards on slate-100 background. No gradients, no decorative patterns.

#### `app/(admin)/dashboard/page.tsx`

```tsx
// Server Component
import { PageHeader } from '@/components/common/PageHeader'
import { KpiSection } from '@/features/admin/dashboard/KpiSection'
import { RevenueChart } from '@/features/admin/dashboard/RevenueChart'
import { SubscriptionsByPlanChart } from '@/features/admin/dashboard/SubscriptionsByPlanChart'
import { OrgRegistrationsChart } from '@/features/admin/dashboard/OrgRegistrationsChart'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform-wide overview of orgs, subscriptions, and revenue."
      />
      <KpiSection />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <SubscriptionsByPlanChart />
      </div>
      <OrgRegistrationsChart />
    </div>
  )
}
```

#### `src/features/admin/dashboard/KpiSection.tsx`

```tsx
'use client'
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard'
import { KpiCard } from './KpiCard'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

export function KpiSection() {
  const { data, isLoading } = useAdminDashboard()
  if (isLoading) return <LoadingSkeleton variant="kpi-grid" />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard label="Property Groups"       value={data?.totalPropertyGroups}  />
      <KpiCard label="Active Subscriptions"  value={data?.activeSubscriptions}  />
      <KpiCard label="Monthly Revenue"       value={data?.monthlyRevenue} format="currency" />
      <KpiCard label="Active Tenants"        value={data?.activeTenants}        />
    </div>
  )
}
```

#### `src/features/admin/dashboard/KpiCard.tsx`

```tsx
// shadcn Card — no custom CSS
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: number | undefined
  format?: 'number' | 'currency'
}

export function KpiCard({ label, value, format = 'number' }: KpiCardProps) {
  const display = format === 'currency'
    ? `₱${(value ?? 0).toLocaleString()}`
    : (value ?? 0).toLocaleString()

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{display}</p>
      </CardContent>
    </Card>
  )
}
```

#### Charts (Recharts — all wrapped in `'use client'`)

All charts use Recharts. Wrap each in a `Card` with `CardHeader` (title) + `CardContent` (chart). Set a fixed height (`h-64`). Use `primary-500` / `accent-500` / `success-600` for bar and line colors. No gradients.

```tsx
// RevenueChart.tsx — example structure
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard'

export function RevenueChart() {
  const { data } = useAdminDashboard()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-700">Monthly Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.revenueTrend ?? []}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="amount" stroke="#3464a4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### 4.3 Property Groups — `/admin/dashboard/property-groups`

#### Design intent
Full-width DataTable. Filter bar above (search by name, filter by status and plan). Each row has an actions dropdown. Clicking a row name opens a `Sheet` (right slide-over) with org details and action buttons. No dedicated detail page — Sheet keeps context.

#### `app/(admin)/dashboard/property-groups/page.tsx`

```tsx
// Server Component
import { PageHeader } from '@/components/common/PageHeader'
import { PropertyGroupsTable } from '@/features/admin/property-groups/PropertyGroupsTable'

export default function PropertyGroupsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Groups"
        description="All landlord organisations on the platform."
      />
      <PropertyGroupsTable />
    </div>
  )
}
```

#### `src/features/admin/property-groups/PropertyGroupsTable.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useAdminPropertyGroups } from '@/features/admin/hooks/useAdminPropertyGroups'
import { DataTable } from '@/components/tables/DataTable'
import { DataTableFilters } from '@/components/tables/DataTableFilters'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PropertyGroupDetailSheet } from './PropertyGroupDetailSheet'
import { SuspendOrgDialog } from './SuspendOrgDialog'
import { OverridePlanDialog } from './OverridePlanDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import type { AdminPropertyGroup } from '@/types/domain.types'
import type { ColumnDef } from '@tanstack/react-table'

export function PropertyGroupsTable() {
  const [filters, setFilters] = useState({ search: '', status: '', plan: '' })
  const [selectedOrg, setSelectedOrg] = useState<AdminPropertyGroup | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<AdminPropertyGroup | null>(null)
  const [overrideTarget, setOverrideTarget] = useState<AdminPropertyGroup | null>(null)

  const { data, isLoading } = useAdminPropertyGroups(filters)

  const columns: ColumnDef<AdminPropertyGroup>[] = [
    {
      accessorKey: 'groupName',
      header: 'Group Name',
      cell: ({ row }) => (
        <button
          className="text-sm font-medium text-primary-700 hover:underline text-left"
          onClick={() => setSelectedOrg(row.original)}
        >
          {row.original.groupName}
        </button>
      ),
    },
    { accessorKey: 'ownerEmail',        header: 'Owner Email',  cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.ownerEmail}</span> },
    { accessorKey: 'subscriptionPlan',  header: 'Plan',         cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.subscriptionPlan}</span> },
    { accessorKey: 'status',            header: 'Status',       cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'unitCount',         header: 'Units',        cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.unitCount}</span> },
    { accessorKey: 'createdAt',         header: 'Created',      cell: ({ row }) => <span className="text-sm text-slate-500">{formatDate(row.original.createdAt)}</span> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedOrg(row.original)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOverrideTarget(row.original)}>Override Plan</DropdownMenuItem>
            <DropdownMenuItem
              className="text-danger-600"
              onClick={() => setSuspendTarget(row.original)}
            >
              {row.original.status === 'ACTIVE' ? 'Suspend Org' : 'Reactivate Org'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (isLoading) return <LoadingSkeleton variant="table" />
  if (!data?.length) return <EmptyState title="No property groups found" description="No orgs match the current filters." />

  return (
    <>
      <DataTableFilters
        searchPlaceholder="Search by group name or owner email..."
        onSearchChange={(s) => setFilters((f) => ({ ...f, search: s }))}
        filters={[
          { label: 'Status', key: 'status', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Suspended', value: 'SUSPENDED' }] },
          { label: 'Plan',   key: 'plan',   options: [{ label: 'Free', value: 'FREE' }, { label: 'Basic', value: 'BASIC' }, { label: 'Pro', value: 'PRO' }] },
        ]}
        onFilterChange={(key, val) => setFilters((f) => ({ ...f, [key]: val }))}
      />
      <DataTable columns={columns} data={data} />

      {/* Sheets and dialogs — rendered outside the table */}
      <PropertyGroupDetailSheet org={selectedOrg} onClose={() => setSelectedOrg(null)} />
      <SuspendOrgDialog    org={suspendTarget}  onClose={() => setSuspendTarget(null)} />
      <OverridePlanDialog  org={overrideTarget} onClose={() => setOverrideTarget(null)} />
    </>
  )
}
```

#### `src/features/admin/property-groups/SuspendOrgDialog.tsx`

```tsx
'use client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSuspendOrg } from '@/features/admin/hooks/useAdminPropertyGroups'

export function SuspendOrgDialog({ org, onClose }: { org: AdminPropertyGroup | null; onClose: () => void }) {
  const { mutate: suspend, isPending } = useSuspendOrg()
  const isSuspended = org?.status === 'SUSPENDED'

  return (
    <ConfirmDialog
      open={!!org}
      onClose={onClose}
      onConfirm={() => suspend({ id: org!.id, status: isSuspended ? 'ACTIVE' : 'SUSPENDED' }, { onSuccess: onClose })}
      title={isSuspended ? 'Reactivate Organisation' : 'Suspend Organisation'}
      description={
        isSuspended
          ? `Reactivate ${org?.groupName}? Their landlords will regain full access.`
          : `Suspend ${org?.groupName}? All landlords in this org will lose access immediately.`
      }
      confirmLabel={isSuspended ? 'Reactivate' : 'Suspend'}
      variant={isSuspended ? 'default' : 'destructive'}
      isPending={isPending}
    />
  )
}
```

#### `src/features/admin/property-groups/OverridePlanDialog.tsx`

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { overridePlanSchema, OverridePlanDto } from '@/lib/validations/admin.schema'
import { useOverridePlan } from '@/features/admin/hooks/useAdminPropertyGroups'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function OverridePlanDialog({ org, onClose }: { org: AdminPropertyGroup | null; onClose: () => void }) {
  const { mutate, isPending } = useOverridePlan()
  const { handleSubmit, setValue, formState: { errors } } = useForm<OverridePlanDto>({
    resolver: zodResolver(overridePlanSchema),
  })

  return (
    <Dialog open={!!org} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override Subscription Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutate({ id: org!.id, ...data }, { onSuccess: onClose }))}
              className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>New Plan</Label>
            <Select onValueChange={(v) => setValue('plan', v)}>
              <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="BASIC">Basic</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
              </SelectContent>
            </Select>
            {errors.plan && <p className="text-xs text-danger-600">{errors.plan.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Override Plan'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 4.4 Users — `/admin/dashboard/users`

#### Design intent
DataTable with search + filter by userType and isActive. Actions dropdown per row: enable/disable, change userType, force password reset. No separate detail page — `Sheet` for user detail.

#### `app/(admin)/dashboard/users/page.tsx`

```tsx
import { PageHeader } from '@/components/common/PageHeader'
import { UsersTable } from '@/features/admin/users/UsersTable'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="All registered users across the platform."
      />
      <UsersTable />
    </div>
  )
}
```

#### `src/features/admin/users/UsersTable.tsx`

```tsx
'use client'
// Same pattern as PropertyGroupsTable above.
// Columns: Email | Name | UserType | Role | Status | Last Login | Actions
// Actions: Toggle isActive (ConfirmDialog) | Change UserType (ChangeUserTypeDialog) | Force Reset (ConfirmDialog)

const columns: ColumnDef<AdminUser>[] = [
  { accessorKey: 'email',     header: 'Email',     cell: ... },
  { accessorKey: 'firstName', header: 'Name',      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}` },
  { accessorKey: 'userType',  header: 'User Type', cell: ({ row }) => <StatusBadge status={row.original.userType} /> },
  { accessorKey: 'isActive',  header: 'Status',    cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
  { accessorKey: 'lastLoginAt', header: 'Last Login', cell: ({ row }) => row.original.lastLoginAt ? formatDate(row.original.lastLoginAt) : '—' },
  { id: 'actions', cell: ... },
]
```

#### `src/features/admin/users/ChangeUserTypeDialog.tsx`

```tsx
// shadcn Dialog + Select for SYSTEM_ADMIN | LANDLORD | TENANT
// Uses useChangeUserType() mutation hook
// Shows ConfirmDialog before submitting — changing userType is destructive
```

---

### 4.5 Subscriptions — `/admin/dashboard/subscriptions`

#### Design intent
DataTable showing all subscriptions. Filter by status (ACTIVE, EXPIRED, GRACE_PERIOD). Highlight EXPIRED and GRACE_PERIOD rows with `StatusBadge`. Extend subscription via a `Dialog` with a date picker.

#### `app/(admin)/dashboard/subscriptions/page.tsx`

```tsx
import { PageHeader } from '@/components/common/PageHeader'
import { SubscriptionsTable } from '@/features/admin/subscriptions/SubscriptionsTable'

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Monitor and manage all organisation subscriptions."
      />
      <SubscriptionsTable />
    </div>
  )
}
```

#### `src/features/admin/subscriptions/SubscriptionsTable.tsx`

```tsx
'use client'
// Columns: Org Name | Plan | Status | Period End | Unit Count | Actions
// Actions: Extend Subscription (ExtendSubscriptionDialog) | Change Plan (OverridePlanDialog reused)
// StatusBadge for: ACTIVE (success), GRACE_PERIOD (warning), EXPIRED (danger), CANCELLED (neutral)

const columns: ColumnDef<AdminSubscription>[] = [
  { accessorKey: 'groupName',         header: 'Organisation' },
  { accessorKey: 'plan',              header: 'Plan' },
  { accessorKey: 'status',            header: 'Status',     cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'currentPeriodEnd',  header: 'Expires',    cell: ({ row }) => formatDate(row.original.currentPeriodEnd) },
  { accessorKey: 'unitCount',         header: 'Units' },
  { id: 'actions', cell: ... },
]
```

#### `src/features/admin/subscriptions/ExtendSubscriptionDialog.tsx`

```tsx
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Date input for new expiry date
// Uses useExtendSubscription() mutation hook
// Confirms with toast.success('Subscription extended') on success
```

---

### 4.6 Add-on Catalog — `/admin/dashboard/addons`

#### Design intent
DataTable of platform-wide add-ons (where `propertyGroupId = null`). "Add Add-on" button in `PageHeader`. Create/Edit uses a `Sheet` (right panel) — not a dialog — because the form has more fields. Delete uses `ConfirmDialog`.

#### `app/(admin)/dashboard/addons/page.tsx`

```tsx
import { PageHeader } from '@/components/common/PageHeader'
import { AddonCatalogTable } from '@/features/admin/addons/AddonCatalogTable'
import { AddAddonButton } from '@/features/admin/addons/AddAddonButton'

export default function AddonsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add-on Catalog"
        description="Platform-wide add-on types available to all landlords."
        action={<AddAddonButton />}
      />
      <AddonCatalogTable />
    </div>
  )
}
```

#### `src/features/admin/addons/AddonCatalogTable.tsx`

```tsx
'use client'
// Columns: Name | Category | Billing Type | Default Rate | Unit of Measure | Actions
// Actions: Edit (AddonForm in Sheet) | Delete (DeleteAddonDialog)
// StatusBadge for billingType: FIXED_AMENITY (blue) | FLAT_FEE (teal) | METERED (amber)

const columns: ColumnDef<AddonCatalog>[] = [
  { accessorKey: 'name',          header: 'Add-on Name' },
  { accessorKey: 'category',      header: 'Category',     cell: ({ row }) => <span className="capitalize">{row.original.category}</span> },
  { accessorKey: 'billingType',   header: 'Billing Type', cell: ({ row }) => <StatusBadge status={row.original.billingType} /> },
  { accessorKey: 'defaultRate',   header: 'Default Rate', cell: ({ row }) => row.original.defaultRate ? `₱${row.original.defaultRate}` : '—' },
  { accessorKey: 'unitOfMeasure', header: 'Unit',         cell: ({ row }) => row.original.unitOfMeasure ?? '—' },
  { id: 'actions', cell: ... },
]
```

#### `src/features/admin/addons/AddonForm.tsx`

```tsx
'use client'
// Used inside a Sheet for both create and edit
// Fields:
//   name        → Input (required)
//   category    → Select: internet | utility | parking | laundry | security | pet | amenity
//   billingType → Select: FIXED_AMENITY | FLAT_FEE | METERED
//   defaultRate → Input[number] (optional, shown when billingType = FLAT_FEE or METERED)
//   unitOfMeasure → Input (shown only when billingType = METERED — kWh | cubic_meter | kg | load)

// Uses React Hook Form + addonSchema
// useWatch('billingType') controls conditional field visibility

// On create: POST /admin/addon-catalog → useCreateAddon() mutation
// On edit:   PATCH /admin/addon-catalog/:id → useUpdateAddon() mutation
// Both invalidate adminAddonKeys.all on success
```

**Zod schema — `src/lib/validations/admin.schema.ts`:**
```typescript
export const addonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['internet', 'utility', 'parking', 'laundry', 'security', 'pet', 'amenity']),
  billingType: z.enum(['FIXED_AMENITY', 'FLAT_FEE', 'METERED']),
  defaultRate: z.number().positive().optional(),
  unitOfMeasure: z.string().optional(),
}).refine(
  (d) => d.billingType !== 'METERED' || !!d.unitOfMeasure,
  { message: 'Unit of measure is required for METERED add-ons', path: ['unitOfMeasure'] }
)
export type AddonDto = z.infer<typeof addonSchema>
```

---

### 4.7 Audit Trail — `/admin/dashboard/audit`

#### Design intent
DataTable with a dedicated filter bar (entity type, user search, date range). Each row shows the action summary. Clicking a row expands an inline diff viewer (old → new JSON). No navigation away from the page — everything inline. Read-only — no action buttons.

#### `app/(admin)/dashboard/audit/page.tsx`

```tsx
import { PageHeader } from '@/components/common/PageHeader'
import { AuditTable } from '@/features/admin/audit/AuditTable'

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Immutable log of all data mutations across the platform."
      />
      <AuditTable />
    </div>
  )
}
```

#### `src/features/admin/audit/AuditTable.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useAdminAudit } from '@/features/admin/hooks/useAdminAudit'
import { AuditFilters } from './AuditFilters'
import { AuditDiffViewer } from './AuditDiffViewer'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { AuditEntry } from '@/types/domain.types'
import type { ColumnDef } from '@tanstack/react-table'

export function AuditTable() {
  const [filters, setFilters] = useState({ tableName: '', userId: '', dateFrom: '', dateTo: '' })
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data, isLoading } = useAdminAudit(filters)

  const columns: ColumnDef<AuditEntry>[] = [
    { accessorKey: 'action',    header: 'Action',   cell: ({ row }) => <StatusBadge status={row.original.action} /> },
    { accessorKey: 'tableName', header: 'Table',    cell: ({ row }) => <code className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{row.original.tableName}</code> },
    { accessorKey: 'userEmail', header: 'User' },
    { accessorKey: 'ipAddress', header: 'IP Address', cell: ({ row }) => row.original.ipAddress ?? '—' },
    { accessorKey: 'createdAt', header: 'Timestamp', cell: ({ row }) => formatDate(row.original.createdAt) },
    {
      id: 'expand',
      cell: ({ row }) => (
        <button
          className="text-xs text-accent-500 hover:text-accent-600"
          onClick={() => setExpanded(expanded === row.original.id ? null : row.original.id)}
        >
          {expanded === row.original.id ? 'Hide diff' : 'View diff'}
        </button>
      ),
    },
  ]

  return (
    <>
      <AuditFilters filters={filters} onChange={setFilters} />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        expandedRow={expanded}
        renderExpanded={(row) => (
          <AuditDiffViewer oldValues={row.oldValues} newValues={row.newValues} />
        )}
      />
    </>
  )
}
```

#### `src/features/admin/audit/AuditDiffViewer.tsx`

```tsx
'use client'
// Read-only. Shows a two-column diff: OLD (left, red tint) → NEW (right, green tint)
// Renders JSON keys as rows with old/new values side by side
// Uses a simple object diff — highlight changed keys
// shadcn Card with CardContent, monospace font for values

interface Props {
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
}

export function AuditDiffViewer({ oldValues, newValues }: Props) {
  const allKeys = Array.from(new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]))

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-md border border-slate-200">
      <div>
        <p className="text-xs font-semibold text-danger-600 uppercase tracking-wide mb-2">Before</p>
        {allKeys.map((key) => (
          <div key={key} className="flex gap-2 py-1 border-b border-slate-100 text-xs">
            <span className="text-slate-500 min-w-32 font-mono">{key}</span>
            <span className="text-slate-700 font-mono">{String(oldValues?.[key] ?? '—')}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-success-600 uppercase tracking-wide mb-2">After</p>
        {allKeys.map((key) => {
          const changed = oldValues?.[key] !== newValues?.[key]
          return (
            <div key={key} className={cn('flex gap-2 py-1 border-b border-slate-100 text-xs', changed && 'bg-success-50')}>
              <span className="text-slate-500 min-w-32 font-mono">{key}</span>
              <span className={cn('font-mono', changed ? 'text-success-700 font-medium' : 'text-slate-700')}>
                {String(newValues?.[key] ?? '—')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 5. API Layer

All calls go through `src/lib/api/admin.api.ts`. Import `apiClient` from `src/lib/api/client.ts`.

```typescript
// src/lib/api/admin.api.ts
import { apiClient } from './client'
import type {
  AdminPropertyGroup, AdminUser, AdminSubscription,
  AddonCatalog, AuditEntry
} from '@/types/domain.types'
import type { PaginatedResponse } from '@/types/api.types'

// ── Dashboard ──────────────────────────────────────────────────
export const adminApi = {
  getDashboardStats: () =>
    apiClient.get<{ data: DashboardStats }>('/admin/stats').then(r => r.data.data),

  // ── Property Groups ───────────────────────────────────────────
  getPropertyGroups: (params: PropertyGroupFilters) =>
    apiClient.get<PaginatedResponse<AdminPropertyGroup>>('/admin/property-groups', { params }).then(r => r.data),

  updatePropertyGroup: (id: string, body: Partial<{ status: OrgStatus; plan: string }>) =>
    apiClient.patch(`/admin/property-groups/${id}`, body).then(r => r.data.data),

  // ── Users ─────────────────────────────────────────────────────
  getUsers: (params: UserFilters) =>
    apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', { params }).then(r => r.data),

  updateUser: (id: string, body: Partial<{ isActive: boolean; userType: UserType }>) =>
    apiClient.patch(`/admin/users/${id}`, body).then(r => r.data.data),

  // ── Subscriptions ─────────────────────────────────────────────
  getSubscriptions: (params: SubFilters) =>
    apiClient.get<PaginatedResponse<AdminSubscription>>('/admin/subscriptions', { params }).then(r => r.data),

  extendSubscription: (id: string, body: { newPeriodEnd: string }) =>
    apiClient.patch(`/admin/subscriptions/${id}`, body).then(r => r.data.data),

  // ── Add-on Catalog ────────────────────────────────────────────
  getAddons: () =>
    apiClient.get<{ data: AddonCatalog[] }>('/admin/addon-catalog').then(r => r.data.data),

  createAddon: (body: AddonDto) =>
    apiClient.post('/admin/addon-catalog', body).then(r => r.data.data),

  updateAddon: (id: string, body: Partial<AddonDto>) =>
    apiClient.patch(`/admin/addon-catalog/${id}`, body).then(r => r.data.data),

  deleteAddon: (id: string) =>
    apiClient.delete(`/admin/addon-catalog/${id}`),

  // ── Audit Trail ───────────────────────────────────────────────
  getAuditTrail: (params: AuditFilters) =>
    apiClient.get<PaginatedResponse<AuditEntry>>('/admin/audit', { params }).then(r => r.data),
}
```

---

## 6. Zod Schemas

```typescript
// src/lib/validations/admin.schema.ts
import { z } from 'zod'

export const overridePlanSchema = z.object({
  plan: z.enum(['FREE', 'BASIC', 'PRO'], { required_error: 'Select a plan' }),
})
export type OverridePlanDto = z.infer<typeof overridePlanSchema>

export const extendSubscriptionSchema = z.object({
  newPeriodEnd: z.string().min(1, 'Select a date'),
})
export type ExtendSubscriptionDto = z.infer<typeof extendSubscriptionSchema>

export const changeUserTypeSchema = z.object({
  userType: z.enum(['SYSTEM_ADMIN', 'LANDLORD', 'TENANT']),
})
export type ChangeUserTypeDto = z.infer<typeof changeUserTypeSchema>

export const addonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['internet', 'utility', 'parking', 'laundry', 'security', 'pet', 'amenity']),
  billingType: z.enum(['FIXED_AMENITY', 'FLAT_FEE', 'METERED']),
  defaultRate: z.number().positive().optional(),
  unitOfMeasure: z.string().optional(),
}).refine(
  (d) => d.billingType !== 'METERED' || !!d.unitOfMeasure,
  { message: 'Unit of measure is required for metered add-ons', path: ['unitOfMeasure'] }
)
export type AddonDto = z.infer<typeof addonSchema>
```

---

## 7. TanStack Query Hooks

All hooks live in `src/features/admin/hooks/`. Each file exports a query key factory + hooks.

```typescript
// src/features/admin/hooks/useAdminPropertyGroups.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin.api'
import { toast } from 'sonner'

export const adminOrgKeys = {
  all:  ['admin', 'orgs']           as const,
  list: (f: object) => [...adminOrgKeys.all, f] as const,
}

export function useAdminPropertyGroups(filters: PropertyGroupFilters) {
  return useQuery({
    queryKey: adminOrgKeys.list(filters),
    queryFn:  () => adminApi.getPropertyGroups(filters),
  })
}

export function useSuspendOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrgStatus }) =>
      adminApi.updatePropertyGroup(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminOrgKeys.all })
      toast.success('Organisation status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useOverridePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      adminApi.updatePropertyGroup(id, { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminOrgKeys.all })
      toast.success('Subscription plan overridden')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
```

```typescript
// src/features/admin/hooks/useAdminUsers.ts
export const adminUserKeys = {
  all:  ['admin', 'users']           as const,
  list: (f: object) => [...adminUserKeys.all, f] as const,
}
export function useAdminUsers(filters: UserFilters) { ... }
export function useToggleUserActive() { ... }    // PATCH /admin/users/:id { isActive }
export function useChangeUserType() { ... }      // PATCH /admin/users/:id { userType }
```

```typescript
// src/features/admin/hooks/useAdminAddons.ts
export const adminAddonKeys = {
  all:  ['admin', 'addons'] as const,
}
export function useAdminAddons() { ... }      // GET  /admin/addon-catalog
export function useCreateAddon() { ... }      // POST /admin/addon-catalog
export function useUpdateAddon() { ... }      // PATCH /admin/addon-catalog/:id
export function useDeleteAddon() { ... }      // DELETE /admin/addon-catalog/:id
```

```typescript
// src/features/admin/hooks/useAdminAudit.ts
export const adminAuditKeys = {
  all:  ['admin', 'audit']           as const,
  list: (f: object) => [...adminAuditKeys.all, f] as const,
}
export function useAdminAudit(filters: AuditFilters) { ... }   // GET /admin/audit
```

---

## 8. Design System Reference

### Layout
- **Page background:** `bg-slate-100`
- **Cards:** `bg-white border border-slate-200 rounded-lg shadow-sm`
- **Sidebar:** `bg-primary-700 text-white`
- **TopBar:** `bg-white border-b border-slate-200`

### Typography
- **Page title:** `text-slate-900 text-xl font-semibold`
- **Section label:** `text-slate-500 text-xs font-semibold uppercase tracking-wide`
- **Body text:** `text-slate-700 text-sm`
- **Muted:** `text-slate-500 text-sm`
- **Code / mono:** `font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded`

### Buttons
- **Primary action:** `bg-primary-700 hover:bg-primary-600 text-white`
- **Secondary/Outline:** `border border-slate-200 text-slate-700 hover:bg-slate-50`
- **Destructive:** `bg-danger-600 hover:bg-danger-700 text-white`
- **Ghost:** `text-slate-600 hover:bg-slate-100`

### Status Badges (use `<StatusBadge status="..." />` always)
| Status | Color |
|---|---|
| `ACTIVE` | `bg-success-100 text-success-700 border-success-200` |
| `SUSPENDED` / `INACTIVE` | `bg-danger-100 text-danger-700 border-danger-200` |
| `GRACE_PERIOD` / `EXPIRED` | `bg-warning-100 text-warning-700 border-warning-200` |
| `SYSTEM_ADMIN` | `bg-primary-100 text-primary-700 border-primary-200` |
| `LANDLORD` | `bg-accent-100 text-accent-700 border-accent-200` |
| `TENANT` | `bg-slate-100 text-slate-600 border-slate-200` |
| `CREATE` | `bg-success-100 text-success-700 border-success-200` |
| `UPDATE` | `bg-accent-100 text-accent-700 border-accent-200` |
| `DELETE` | `bg-danger-100 text-danger-700 border-danger-200` |
| `FIXED_AMENITY` | `bg-primary-100 text-primary-700 border-primary-200` |
| `FLAT_FEE` | `bg-accent-100 text-accent-600 border-accent-200` |
| `METERED` | `bg-warning-100 text-warning-700 border-warning-200` |

### DataTable conventions
- Header row: `bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide`
- Body rows: `bg-white border-b border-slate-100 hover:bg-primary-50`
- Actions column: always rightmost, `DropdownMenu` with `MoreHorizontal` icon button
- All destructive row actions (suspend, delete) — wrap in `ConfirmDialog` before firing mutation
- Never fire a DELETE or status-change mutation directly from a dropdown click

### Forms in Sheets vs Dialogs
- **Sheet (right slide-over):** use for create/edit forms with 4+ fields (AddonForm, UserDetailSheet)
- **Dialog:** use for simple confirmation or 1–2 field overrides (OverridePlanDialog, ExtendSubscriptionDialog)
- **ConfirmDialog:** use for all destructive actions — suspend, delete, disable account

---

## 9. Build Order & Checklist

Build in this exact order. Each item must be complete (including types and hook) before starting the next.

### Phase 1 — Foundation + Auth + Core Pages

- [ ] `src/types/domain.types.ts` — add AdminPropertyGroup, AdminUser, AdminSubscription, AddonCatalog, AuditEntry
- [ ] `src/lib/api/client.ts` — Axios instance with JWT + error interceptors
- [ ] `src/lib/api/admin.api.ts` — all admin API calls
- [ ] `src/lib/api/auth.api.ts` — login, forgotPassword, resetPassword
- [ ] `src/lib/validations/auth.schema.ts` — loginSchema, forgotPasswordSchema, resetPasswordSchema
- [ ] `src/lib/validations/admin.schema.ts` — all admin schemas
- [ ] `src/components/common/StatusBadge.tsx` — add admin statuses (OrgStatus, AuditAction, AddonBillingType)
- [ ] `src/components/common/PageHeader.tsx`
- [ ] `src/components/common/LoadingSkeleton.tsx` — add `kpi-grid` and `table` variants
- [ ] `src/components/common/EmptyState.tsx`
- [ ] `src/components/common/ConfirmDialog.tsx`
- [ ] `src/components/tables/DataTable.tsx` — TanStack Table wrapper
- [ ] `src/components/tables/DataTableFilters.tsx`
- [ ] `src/components/tables/DataTablePagination.tsx`
- [ ] `src/components/layout/AdminSidebar.tsx`
- [ ] `src/components/layout/TopBar.tsx`
- [ ] `app/(auth)/layout.tsx`
- [ ] `app/(auth)/login/page.tsx` + `src/features/auth/LoginForm.tsx`
- [ ] `app/(auth)/forgot-password/page.tsx` + `src/features/auth/ForgotPasswordForm.tsx`
- [ ] `app/(auth)/reset-password/page.tsx` + `src/features/auth/ResetPasswordForm.tsx`
- [ ] `app/(admin)/layout.tsx`
- [ ] `src/features/admin/hooks/useAdminDashboard.ts`
- [ ] `src/features/admin/dashboard/KpiCard.tsx`
- [ ] `src/features/admin/dashboard/KpiSection.tsx`
- [ ] `src/features/admin/dashboard/RevenueChart.tsx`
- [ ] `src/features/admin/dashboard/SubscriptionsByPlanChart.tsx`
- [ ] `src/features/admin/dashboard/OrgRegistrationsChart.tsx`
- [ ] `app/(admin)/dashboard/page.tsx`

### Phase 2 — Property Groups + Users

- [ ] `src/features/admin/hooks/useAdminPropertyGroups.ts`
- [ ] `src/features/admin/property-groups/PropertyGroupsTable.tsx`
- [ ] `src/features/admin/property-groups/PropertyGroupDetailSheet.tsx`
- [ ] `src/features/admin/property-groups/SuspendOrgDialog.tsx`
- [ ] `src/features/admin/property-groups/OverridePlanDialog.tsx`
- [ ] `app/(admin)/dashboard/property-groups/page.tsx`
- [ ] `src/features/admin/hooks/useAdminUsers.ts`
- [ ] `src/features/admin/users/UsersTable.tsx`
- [ ] `src/features/admin/users/UserDetailSheet.tsx`
- [ ] `src/features/admin/users/ChangeUserTypeDialog.tsx`
- [ ] `app/(admin)/dashboard/users/page.tsx`

### Phase 3 — Subscriptions + Add-on Catalog

- [ ] `src/features/admin/hooks/useAdminSubscriptions.ts`
- [ ] `src/features/admin/subscriptions/SubscriptionsTable.tsx`
- [ ] `src/features/admin/subscriptions/ExtendSubscriptionDialog.tsx`
- [ ] `app/(admin)/dashboard/subscriptions/page.tsx`
- [ ] `src/features/admin/hooks/useAdminAddons.ts`
- [ ] `src/features/admin/addons/AddonCatalogTable.tsx`
- [ ] `src/features/admin/addons/AddonForm.tsx`
- [ ] `src/features/admin/addons/DeleteAddonDialog.tsx`
- [ ] `app/(admin)/dashboard/addons/page.tsx`

### Phase 4 — Audit Trail

- [ ] `src/features/admin/hooks/useAdminAudit.ts`
- [ ] `src/features/admin/audit/AuditFilters.tsx`
- [ ] `src/features/admin/audit/AuditTable.tsx`
- [ ] `src/features/admin/audit/AuditDiffViewer.tsx`
- [ ] `app/(admin)/dashboard/audit/page.tsx`

---

## Definition of Done — per page

Before marking any page complete, verify all of the following:

- [ ] All data fetched via TanStack Query hook — no `useState` + `useEffect` for data
- [ ] Loading state shows `<LoadingSkeleton />` — never a raw spinner or blank screen
- [ ] Empty results show `<EmptyState />` — never a blank table
- [ ] All status values use `<StatusBadge status="..." />` — never inline badge classes
- [ ] All destructive actions (suspend, delete, disable) gated by `<ConfirmDialog />`
- [ ] All forms use React Hook Form + Zod schema — no uncontrolled inputs
- [ ] Submit buttons disabled + show loading text while mutation is `isPending`
- [ ] Mutation success shows `toast.success(...)` via Sonner
- [ ] Mutation error shows `toast.error(err.message)` via Sonner
- [ ] Successful mutations call `queryClient.invalidateQueries()` with the correct key
- [ ] `'use client'` only on components that use hooks/events — never on `page.tsx`
- [ ] No raw hex values in `className` — use Tailwind palette classes only
- [ ] TypeScript strict — no `any`, no `as unknown as X`
- [ ] `internalNotes` never referenced in any admin component (landlord data only)