# RentHub — Web Frontend Gameplan

> Post-login redirect by Role + UserType · Landing page · Login redesign · Dashboard shell alignment

**Scope:** Web frontend only. Aligns with [renthub-frontend-roadmap.md](renthub-frontend-roadmap.md), [renthub-architecture-dashboard-v2.html](renthub-architecture-dashboard-v2.html), and design refs: `web-login-design/`, Admin Dashboard Design.

---

## Table of Contents

1. [Post-Login Redirect (Role + UserType)](#1-post-login-redirect-role--usertype)
2. [RentHub Landing Page](#2-renthub-landing-page)
3. [Login Page Redesign](#3-login-page-redesign)
4. [Post-Login Shell: Sidebar, Header, Layout](#4-post-login-shell-sidebar-header-layout)
5. [Implementation Checklist](#5-implementation-checklist)

---

## 1. Post-Login Redirect (Role + UserType)

### Rules

| User Role | User Type     | Redirect destination |
|-----------|---------------|----------------------|
| **Admin** | **System Admin** | **Admin Dashboard** (`/dashboard`) |
| **user**  | **Landlord**     | **Overview** (via `/select-group` → `/[pgId]/overview`) |

- Backend uses `UserRole`: `ADMIN` \| `USER` and `UserType`: `SYSTEM_ADMIN` \| `LANDLORD` \| `TENANT`.
- Redirect must consider **both** `role` and `userType` so that only users with the correct combination reach each area.

### Current vs desired behavior

- **Current:** Middleware and layouts use `userType` only (e.g. `SYSTEM_ADMIN` → `/dashboard`, `LANDLORD` → `/select-group`).
- **Desired:**
  - **Admin Dashboard:** Only when `role === 'ADMIN'` **and** `userType === 'SYSTEM_ADMIN'` → redirect to `/dashboard`.
  - **Landlord Overview:** When `role === 'USER'` **and** `userType === 'LANDLORD'` → redirect to `/select-group`; select-group then sends user to `/[pgId]/overview` (first active property group). If you prefer “Overview” to mean a single default page without select-group, that can be a separate route (e.g. `/overview` that resolves `pgId` server-side); for this gameplan we keep the existing flow: login → select-group → `/[pgId]/overview`.

### Implementation points

1. **Middleware** (`frontend/middleware.ts`)
   - Read both `token.role` and `token.userType` (ensure auth callbacks expose `role` in JWT/session).
   - Root `/`:
     - If `role === 'ADMIN'` and `userType === 'SYSTEM_ADMIN'` → redirect to `/dashboard`.
     - If `role === 'USER'` and `userType === 'LANDLORD'` → redirect to `/select-group` (which then redirects to `/[pgId]/overview`).
     - If `userType === 'TENANT'` → redirect to `/tenant-use-mobile`.
     - Else → redirect to `/login`.
   - Protect `/dashboard` and `/dashboard/*`: allow only when `role === 'ADMIN'` **and** `userType === 'SYSTEM_ADMIN'`; otherwise redirect to `/select-group` or `/login` as appropriate.

2. **Auth layout / LoginForm**
   - After successful login, redirect to **`/`** (e.g. `router.push('/')` then `router.refresh()`). The next request will carry the new JWT cookie, so **middleware** can read `role` and `userType` and redirect to `/dashboard`, `/select-group`, or `/tenant-use-mobile`. This avoids relying on `signIn()` result (which does not include role/userType on the client).
   - If a `callbackUrl` query param is present, you may still respect it (e.g. deep link after login); otherwise use `/`.

3. **Admin layout** (`app/(admin)/layout.tsx`)
   - Restrict not only by `userType === 'SYSTEM_ADMIN'` but also `role === 'ADMIN'`; if either fails, redirect to `/select-group` or `/login`.

4. **Landlord layout** (`app/(landlord)/layout.tsx` and `app/select-group/page.tsx`)
   - Landlord area: allow when `userType === 'LANDLORD'` (and optionally require `role === 'USER'` for clarity). Keep redirect to first active group’s overview as today.

---

## 2. RentHub Landing Page

### Purpose

- Public marketing page for RentHub (before login).
- Can be the default route when the user is not authenticated (e.g. `/` or a dedicated `/landing` with `/` redirecting there when logged out).

### Format to follow

Use a structure consistent with a typical SaaS landing page (you can base or follow the format of your reference “landing page design” when you attach it). Suggested sections:

1. **Hero**
   - Headline + subheadline (e.g. “Simplify rental management”).
   - Primary CTA: “Get started” / “Sign up” → `/register`; secondary “Sign in” → `/login`.
   - Optional hero image or illustration.

2. **Features (2–3 columns)**
   - Short feature blocks (e.g. “Manage properties”, “Track tenants & payments”, “Secure & fast”) with icons.
   - Align tone with the login left panel: “Secure Access”, “Fast Sync”, etc.

3. **Social proof (optional)**
   - Short testimonial or “Trusted by landlords” line.

4. **Footer**
   - Links: Sign in, Register, Forgot password, Terms, Privacy.
   - Copyright: “© 2024 RentHub SaaS Platform” (match login design).

### Design alignment

- Reuse the same design tokens as the login redesign so the whole marketing + auth flow feels one product:
  - **Primary:** `#1a4570` (and hover `#143654`), **primary-soft:** `#2E5C8A`.
  - **Font:** Manrope (from login design).
  - **Background:** `#f6f7f8` (light), optional dark `#13191f`.
- If you have a specific “landing page design” file (Figma, image, or HTML), add it to the repo and reference it here (e.g. `docs/landing-page-design.png` or `designs/landing.fig`) so implementation can match it section-by-section.

### Routes

- **Option A:** `/` is the landing page; when user is logged in, middleware redirects `/` by role/userType (as in §1).
- **Option B:** `/` redirects to `/landing` when unauthenticated; `/landing` is the full landing page; login/register linked from there.

---

## 3. Login Page Redesign

### Reference

- **Design:** `web-login-design/screen.png` (mock) and `web-login-design/code.html` (implementation reference).

### Layout

- **Desktop:** Two columns.
  - **Left (~50%):** Branding panel.
    - Background: primary blue `#1a4570`, subtle dot pattern.
    - Logo: icon + “RentHub”.
    - Headline: “Welcome back to RentHub”.
    - Subtext: “Your simplified rental management solution…”
    - Two feature bullets: “Secure Access” (Enterprise-grade security), “Fast Sync” (Real-time data updates).
    - Footer: “© 2024 RentHub SaaS Platform. All rights reserved.”
  - **Right:** Login form on white (or `background-light` / dark equivalent).
    - “Sign In” title and short instruction.
    - Email field (left icon: mail), placeholder “e.g., alex@example.com”.
    - Password field (left icon: lock, right: visibility toggle), “Forgot Password?” link.
    - “Remember this device” checkbox.
    - Primary button: “Sign In” + arrow icon.
    - Divider: “Or continue with” + Google / GitHub buttons (can be visual-only initially).
    - “Don’t have an account? Sign Up” link.
- **Mobile:** Single column; show logo at top; then form; left panel content can be hidden or collapsed.

### Theming (from code.html)

- Colors: `primary: #1a4570`, `primary-hover: #143654`, `primary-soft: #2E5C8A`, `background-light: #f6f7f8`, `background-dark: #13191f`.
- Font: Manrope (Google Fonts).
- Icons: Material Symbols Outlined (or replace with Lucide for consistency with the rest of the app).
- Inputs: rounded-lg, border gray-300, focus ring primary-soft/10.
- Button: full width, rounded-lg, bg-primary, hover primary-hover, bold “Sign In” + icon.

### Implementation steps

1. Add Manrope to the app (e.g. `next/font/google` or link in layout).
2. Add Tailwind theme extend for `primary`, `primary-hover`, `primary-soft`, `background-light`, `background-dark` if not already present (see [renthub-color-usage-guide.md](renthub-color-usage-guide.md) for existing primary scale; align with `#1a4570` for this screen).
3. Build a **Login layout** that implements the two-column layout (left panel + right form) and mobile variant.
4. Move current login form content into the right column; style inputs and button to match `code.html` (labels, icons, spacing, “Forgot Password?”, “Remember this device”, “Sign Up”).
5. Keep existing `LoginForm` logic (credentials, next-auth `signIn`, redirect after login using §1 rules).
6. Optional: Add “Or continue with” and Google/GitHub buttons (placeholders or real OAuth when backend supports it).

---

## 4. Post-Login Shell: Sidebar, Header, Layout

### Reference

- **Admin Dashboard Design** (and existing app structure): Sidebar + header (top bar) for both Admin and Landlord portals.

### Current implementation

- **AppShell** (`src/components/layout/AppShell.tsx`): Renders `Sidebar` + `TopBar` + main content; `isAdmin` and `pgId` drive which nav is shown.
- **Sidebar** (`src/components/layout/Sidebar.tsx`): Admin nav (`/dashboard`, `/dashboard/landlords`, etc.) or Landlord nav (`/[pgId]/overview`, properties, tenants, leases, payments); fixed left, collapsible (e.g. `useSidebarStore`).
- **TopBar** (`src/components/layout/TopBar.tsx`): Menu toggle, optional title, sign out.
- **Layouts:** `(admin)/layout.tsx` uses `AppShell isAdmin`; `(landlord)/[pgId]/layout.tsx` uses `AppShell pgId={pgId} isAdmin={false}`.

### What to align with “Admin Dashboard Design”

1. **Visual style**
   - Use the same design system as the new login and landing: primary palette (`#1a4570` family), Manrope, and any spacing/shadows from the design.
   - Sidebar: background and text colors that match the design (e.g. primary-700 / primary-800 for sidebar, white/primary-300 for text and hover).
   - Header: height, border, logo placement, user/sign-out area to match the design.

2. **Structure**
   - Sidebar: same nav items as now (Dashboard, Landlords, Subscriptions, Settings for admin; Overview, Properties, Tenants, Leases, Payments for landlord).
   - Header: hamburger to toggle sidebar, page title or breadcrumb if in the design, user menu and sign out.

3. **Responsiveness**
   - Sidebar collapses to overlay or hidden on small screens; main content margin adjusts (e.g. `ml-56` when open, `ml-0` when closed).
   - TopBar stays visible; ensure tap targets and spacing match the design.

### Concrete tasks

- Extract any missing design tokens from the Admin Dashboard Design (sidebar width, header height, colors, radii) and add them to Tailwind/globals.
- Update `Sidebar.tsx` and `TopBar.tsx` classes to use these tokens so both Admin and Landlord shells match the same design.
- Ensure `(admin)/layout.tsx` and `(landlord)/[pgId]/layout.tsx` pass the correct `isAdmin` and `pgId` so the same shell component is used with the right nav.

---

## 5. Implementation Checklist

### Phase A — Redirect and auth

- [ ] Ensure JWT/session includes both `role` and `userType` (already in place; verify from login API response).
- [ ] **Middleware:** Redirect `/` using both `role` and `userType`: ADMIN + SYSTEM_ADMIN → `/dashboard`; USER + LANDLORD → `/select-group`; TENANT → `/tenant-use-mobile`; else `/login`.
- [ ] **Middleware:** Restrict `/dashboard` and `/dashboard/*` to `role === 'ADMIN'` and `userType === 'SYSTEM_ADMIN'`.
- [ ] **LoginForm:** After successful sign-in, redirect by role+userType (dashboard vs select-group vs tenant-use-mobile).
- [ ] **Admin layout:** Require `role === 'ADMIN'` and `userType === 'SYSTEM_ADMIN'`; else redirect.
- [ ] **Landlord/select-group:** Keep current behavior; optionally enforce `role === 'USER'` for landlord routes.

### Phase B — Landing page

- [ ] Add route: `/` as landing (when unauthenticated) or `/landing` with redirect from `/` when unauthenticated.
- [ ] Implement hero, features, CTA, footer using Manrope and primary palette.
- [ ] Link “Sign in” → `/login`, “Sign up” → `/register`.

### Phase C — Login redesign

- [ ] Add Manrope and design tokens (primary, primary-hover, primary-soft, background-light/dark).
- [ ] Build two-column login layout (left branding, right form) and mobile layout.
- [ ] Restyle `LoginForm`: labels, icons in inputs, Forgot Password link, Remember me, Sign In button with icon, “Or continue with”, Sign Up link.
- [ ] Optional: Material Symbols or Lucide for mail, lock, visibility, arrow, apartment.

### Phase D — Dashboard shell (sidebar, header)

- [ ] Align Sidebar and TopBar with Admin Dashboard Design (colors, spacing, typography).
- [ ] Ensure one AppShell serves both Admin and Landlord with correct nav and tokens.
- [ ] Test responsive behavior (sidebar toggle, main content margin).

---

## Summary

| Item | Action |
|------|--------|
| **Redirect** | Use **Role + UserType**: Admin + System Admin → `/dashboard`; user + Landlord → `/select-group` → `/[pgId]/overview`. |
| **Landing** | Add RentHub landing page (hero, features, CTA, footer); follow your landing page design format; use same design system as login. |
| **Login** | Redesign to match `web-login-design` (two-column layout, Manrope, primary #1a4570, form styling from code.html). |
| **Shell** | Align Sidebar, header, and layout with Admin Dashboard Design; reuse AppShell for both Admin and Landlord. |

Once this is done, the web frontend will have consistent redirect logic, a clear landing, a matching login UI, and a unified dashboard shell across Admin and Landlord.
