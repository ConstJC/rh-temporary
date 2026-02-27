# RentHub — Color System Usage Guide
> How to wire the `#1e3a5f` palette into your Next.js project · Minimalist, production-ready

---

## Setup Checklist

- [ ] Install `tailwind-merge` + `clsx`
- [ ] Update `tailwind.config.ts` with custom color scales
- [ ] Update `globals.css` with CSS variables + base styles
- [ ] Create `src/lib/utils.ts` with `cn()` helper
- [ ] Create `src/components/common/StatusBadge.tsx`

---

## Step 1 — Install Dependencies

```bash
npm install tailwind-merge clsx
```

---

## Step 2 — `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          950: '#0a1628',
          900: '#0f2040',
          800: '#152d58',
          700: '#1e3a5f',  // BASE
          600: '#2a4f82',
          500: '#3464a4',
          400: '#5c89c4',
          300: '#8aafd8',
          200: '#b8cfec',
          100: '#dce8f5',
          50:  '#eef4fb',
          DEFAULT: '#1e3a5f',
        },
        accent: {
          600: '#0284c7',
          500: '#0ea5e9',  // BASE
          400: '#38bdf8',
          100: '#e0f2fe',
          50:  '#f0f9ff',
          DEFAULT: '#0ea5e9',
        },
        success: {
          700: '#15803d',
          600: '#16a34a',  // BASE
          200: '#bbf7d0',
          100: '#dcfce7',
          DEFAULT: '#16a34a',
        },
        warning: {
          700: '#b45309',
          600: '#d97706',  // BASE
          200: '#fde68a',
          100: '#fef3c7',
          DEFAULT: '#d97706',
        },
        danger: {
          700: '#b91c1c',
          600: '#dc2626',  // BASE
          200: '#fecaca',
          100: '#fee2e2',
          DEFAULT: '#dc2626',
        },
      },
    },
  },
}

export default config
```

---

## Step 3 — `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Page surfaces */
    --bg-page:    #f1f5f9;
    --bg-card:    #ffffff;
    --bg-sidebar: #1e3a5f;

    /* Borders */
    --border:        #e2e8f0;
    --border-strong: #cbd5e1;

    /* Text */
    --text-primary:   #0f2040;
    --text-secondary: #475569;
    --text-muted:     #94a3b8;
    --text-inverse:   #ffffff;
  }

  body {
    background-color: #f1f5f9;
    color: #0f2040;
  }
}
```

---

## Step 4 — `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Step 5 — `src/components/common/StatusBadge.tsx`

```tsx
import { cn } from '@/lib/utils'

const statusMap = {
  // Payment
  PAID:        'bg-success-100 text-success-700 border-success-200',
  UNPAID:      'bg-slate-100   text-slate-600   border-slate-200',
  PARTIAL:     'bg-warning-100 text-warning-700 border-warning-200',
  OVERDUE:     'bg-danger-100  text-danger-700  border-danger-200',
  // Lease
  ACTIVE:      'bg-primary-100 text-primary-700 border-primary-200',
  CLOSED:      'bg-slate-100   text-slate-600   border-slate-200',
  EXPIRED:     'bg-warning-100 text-warning-700 border-warning-200',
  // Unit
  AVAILABLE:   'bg-success-100 text-success-700 border-success-200',
  OCCUPIED:    'bg-primary-100 text-primary-700 border-primary-200',
  MAINTENANCE: 'bg-orange-100  text-orange-700  border-orange-200',
  // Tenant
  MOVED_OUT:   'bg-slate-100   text-slate-600   border-slate-200',
  BLACKLISTED: 'bg-danger-100  text-danger-700  border-danger-200',
} as const

type StatusKey = keyof typeof statusMap

const labelMap: Record<StatusKey, string> = {
  PAID:        'Paid',
  UNPAID:      'Unpaid',
  PARTIAL:     'Partial',
  OVERDUE:     'Overdue',
  ACTIVE:      'Active',
  CLOSED:      'Closed',
  EXPIRED:     'Expired',
  AVAILABLE:   'Available',
  OCCUPIED:    'Occupied',
  MAINTENANCE: 'Maintenance',
  MOVED_OUT:   'Moved Out',
  BLACKLISTED: 'Blacklisted',
}

export function StatusBadge({ status }: { status: StatusKey }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-xs font-semibold border',
        statusMap[status]
      )}
    >
      {labelMap[status]}
    </span>
  )
}
```

---

## Color Scale Reference

### The One Rule

> Use **700** for solid backgrounds (buttons, sidebar).
> Use **100/200** for light badge and alert backgrounds.
> Use **50** for subtle row tints and hover states.
> Nothing in between unless you have a specific reason.

### Full Scale

| Shade | Hex | Use |
|---|---|---|
| `primary-950` | `#0a1628` | Deepest text on light backgrounds |
| `primary-900` | `#0f2040` | Body text, headings |
| `primary-800` | `#152d58` | Sidebar hover states |
| `primary-700` | `#1e3a5f` | **BASE** — sidebar bg, primary buttons |
| `primary-600` | `#2a4f82` | Button hover state |
| `primary-500` | `#3464a4` | Links, active nav indicators |
| `primary-400` | `#5c89c4` | Icon tints |
| `primary-300` | `#8aafd8` | Sidebar muted text |
| `primary-200` | `#b8cfec` | Light borders, badge borders |
| `primary-100` | `#dce8f5` | Badge backgrounds, info boxes |
| `primary-50`  | `#eef4fb` | Table row hover, subtle tint |

---

## Quick Reference — What Color Goes Where

### Layout & Navigation

| Element | Tailwind Class |
|---|---|
| Sidebar background | `bg-primary-700` |
| Sidebar active nav item | `bg-primary-800` |
| Sidebar nav text | `text-white` |
| Sidebar muted text / icons | `text-primary-300` |
| Sidebar hover item | `hover:bg-primary-800` |
| Page background | `bg-slate-100` |
| Card / panel background | `bg-white` |
| Card border | `border border-slate-200` |
| Section divider | `border-t border-slate-200` |
| TopBar background | `bg-white border-b border-slate-200` |

### Typography

| Element | Tailwind Class |
|---|---|
| Page title / H1 | `text-slate-900 font-semibold` |
| Section heading / H2 | `text-slate-800 font-semibold` |
| Body text | `text-slate-700` |
| Label / caption | `text-slate-500 text-sm` |
| Muted / placeholder | `text-slate-400` |
| Sidebar text | `text-white` |
| Sidebar muted | `text-primary-300` |
| Link | `text-accent-500 hover:text-accent-600` |

### Buttons

| Variant | Tailwind Class |
|---|---|
| Primary | `bg-primary-700 hover:bg-primary-600 text-white` |
| Secondary | `border border-slate-200 text-slate-700 hover:bg-slate-50` |
| Outline primary | `border border-primary-200 text-primary-700 hover:bg-primary-50` |
| Destructive | `bg-danger-600 hover:bg-danger-700 text-white` |
| Ghost | `text-slate-600 hover:bg-slate-100` |
| Disabled | `bg-slate-100 text-slate-400 cursor-not-allowed` |

### Forms & Inputs

| Element | Tailwind Class |
|---|---|
| Input border (default) | `border border-slate-200` |
| Input border (focus) | `focus:border-primary-500 focus:ring-1 focus:ring-primary-500` |
| Input border (error) | `border-danger-500 focus:ring-danger-500` |
| Input text | `text-slate-800` |
| Input placeholder | `placeholder:text-slate-400` |
| Input label | `text-slate-700 font-medium text-sm` |
| Error message | `text-danger-600 text-xs` |
| Helper text | `text-slate-500 text-xs` |

### Tables

| Element | Tailwind Class |
|---|---|
| Table header row | `bg-slate-50` |
| Table header text | `text-slate-500 text-xs font-semibold uppercase tracking-wide` |
| Table header border | `border-b border-slate-200` |
| Table body row | `bg-white` |
| Table row hover | `hover:bg-primary-50` |
| Table row border | `border-b border-slate-100` |
| Table cell text | `text-slate-700 text-sm` |
| Table cell muted | `text-slate-400 text-sm` |

### Alerts & Banners

| Type | Tailwind Class |
|---|---|
| Info | `bg-primary-50 border border-primary-200 text-primary-800` |
| Success | `bg-success-100 border border-success-200 text-success-700` |
| Warning | `bg-warning-100 border border-warning-200 text-warning-700` |
| Error | `bg-danger-100 border border-danger-200 text-danger-700` |

### Status Badges (summary)

| Status | Background | Text | Border |
|---|---|---|---|
| `PAID` / `AVAILABLE` | `bg-success-100` | `text-success-700` | `border-success-200` |
| `UNPAID` / `CLOSED` / `MOVED_OUT` | `bg-slate-100` | `text-slate-600` | `border-slate-200` |
| `PARTIAL` / `EXPIRED` | `bg-warning-100` | `text-warning-700` | `border-warning-200` |
| `OVERDUE` / `BLACKLISTED` | `bg-danger-100` | `text-danger-700` | `border-danger-200` |
| `ACTIVE` / `OCCUPIED` | `bg-primary-100` | `text-primary-700` | `border-primary-200` |
| `MAINTENANCE` | `bg-orange-100` | `text-orange-700` | `border-orange-200` |

---

## Real Component Examples

### Sidebar Nav Item

```tsx
// Active state
<li className="bg-primary-800 text-white rounded-md px-3 py-2 text-sm font-medium">
  Properties
</li>

// Default state
<li className="text-primary-300 hover:bg-primary-800 hover:text-white rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors">
  Tenants
</li>
```

### Primary Button

```tsx
<button className="bg-primary-700 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
  Save Changes
</button>
```

### Secondary Button

```tsx
<button className="border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-md transition-colors">
  Cancel
</button>
```

### Card

```tsx
<div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
  <h3 className="text-slate-800 font-semibold text-sm">Card Title</h3>
  <p className="text-slate-500 text-sm mt-1">Supporting text goes here.</p>
</div>
```

### KPI Metric Card

```tsx
<div className="bg-white border border-slate-200 rounded-lg p-5">
  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Units</p>
  <p className="text-slate-900 text-3xl font-bold mt-1">24</p>
  <p className="text-success-600 text-xs font-medium mt-2">↑ 2 from last month</p>
</div>
```

### Input Field

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-slate-700 text-sm font-medium">Email</label>
  <input
    type="email"
    placeholder="juan@example.com"
    className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
               placeholder:text-slate-400
               focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
               transition-colors"
  />
  <span className="text-slate-400 text-xs">We'll send a verification link here.</span>
</div>
```

### Table Row

```tsx
<tr className="border-b border-slate-100 hover:bg-primary-50 transition-colors">
  <td className="px-4 py-3 text-sm text-slate-700">Ana Garcia</td>
  <td className="px-4 py-3 text-sm text-slate-500">Room 101</td>
  <td className="px-4 py-3">
    <StatusBadge status="OVERDUE" />
  </td>
  <td className="px-4 py-3 text-sm font-medium text-slate-800">₱3,500</td>
</tr>
```

### Info Alert Banner

```tsx
<div className="bg-primary-50 border border-primary-200 rounded-md px-4 py-3 flex items-start gap-3">
  <span className="text-primary-500 mt-0.5">ℹ</span>
  <p className="text-primary-800 text-sm">
    This tenant has no active lease. Assign a unit to create one.
  </p>
</div>
```

### Error Alert Banner

```tsx
<div className="bg-danger-100 border border-danger-200 rounded-md px-4 py-3 flex items-start gap-3">
  <span className="text-danger-600 mt-0.5">⚠</span>
  <p className="text-danger-700 text-sm">
    Payment is overdue by 12 days. Grace period has expired.
  </p>
</div>
```

---

## What NOT to Do

```tsx
// ❌ Raw hex values — Tailwind can't purge these
<div className="bg-[#1e3a5f]">avoid</div>

// ❌ Inline styles for color — defeats the design system
<div style={{ background: '#1e3a5f' }}>avoid</div>

// ❌ Hardcoded status colors scattered across components
<span className="bg-green-100 text-green-700">Paid</span>  // use StatusBadge instead

// ❌ Mixing shade levels inconsistently
<button className="bg-primary-500 hover:bg-primary-300">  // wrong — too light for hover

// ✅ Correct pattern
<div className="bg-primary-700">sidebar</div>
<button className="bg-primary-700 hover:bg-primary-600">button</button>
<StatusBadge status="PAID" />
```

---

## shadcn/ui Integration

shadcn/ui uses its own CSS variable system (`--primary`, `--secondary`, etc.). Map your palette to shadcn's variables in `globals.css` so shadcn components inherit your colors automatically:

```css
@layer base {
  :root {
    --background:   248 250 252;   /* slate-50 */
    --foreground:   15 32 64;      /* primary-900 */
    --card:         255 255 255;
    --card-foreground: 15 32 64;
    --primary:      30 58 95;      /* primary-700 #1e3a5f */
    --primary-foreground: 255 255 255;
    --secondary:    241 245 249;   /* slate-100 */
    --secondary-foreground: 71 85 105;
    --muted:        241 245 249;
    --muted-foreground: 148 163 184;
    --accent:       14 165 233;    /* accent-500 #0ea5e9 */
    --accent-foreground: 255 255 255;
    --destructive:  220 38 38;     /* danger-600 #dc2626 */
    --destructive-foreground: 255 255 255;
    --border:       226 232 240;   /* slate-200 */
    --input:        226 232 240;
    --ring:         30 58 95;      /* primary-700 */
    --radius:       0.5rem;
  }
}
```

> **Note:** shadcn uses space-separated RGB values without `rgb()` wrapper — e.g. `30 58 95` not `#1e3a5f`.

After this, every shadcn component (`Button`, `Input`, `Card`, `Badge`, etc.) will automatically use your navy blue primary with no extra configuration.
