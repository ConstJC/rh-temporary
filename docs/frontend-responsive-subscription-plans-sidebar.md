# Frontend Responsiveness + Subscription Plans Module + Sidebar Recommendations

## Goal
This document defines what to improve in the frontend to make pages fully responsive, what to modify/add for a complete **Subscription Plans** module, and how to improve the sidebar menu structure.

---

## 1) Responsive Frontend Improvements

## 1.1 Current Gaps (from existing code)
- Sidebar is fixed (`h-screen`, `left-0`) and always mounted; mobile behavior is not fully optimized.
- Admin top bar search field can consume too much horizontal space on smaller screens.
- Data-heavy pages (users, subscriptions, landlords/audit) need better mobile table handling.
- No standardized responsive patterns/checklist across admin pages.

## 1.2 Layout-Level Changes (High Priority)

### A. Sidebar behavior (mobile and tablet)
**Files:**
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/stores/sidebar.store.ts`

**Modify:**
- Use off-canvas sidebar on `< lg` with backdrop overlay.
- Keep current collapse behavior on desktop (`lg` and up).
- Add `Esc` close + click-outside close.
- Prevent body scroll when mobile sidebar is open.

### B. Top bar adaptation
**File:** `frontend/src/components/layout/TopBar.tsx`

**Modify:**
- Hide/compact search on small screens (`hidden md:block`).
- Keep icon actions visible and aligned (`notifications`, `profile`).
- Ensure no wrapping/overlap at 320px width.

### C. Main content container
**File:** `frontend/src/components/layout/AppShell.tsx`

**Modify:**
- Use consistent responsive padding: `p-3 sm:p-4 md:p-6`.
- Keep `main` width stable and avoid horizontal overflow.
- Add `overflow-x-hidden` at shell level where needed.

## 1.3 Page Component Standards (Medium Priority)

### A. Tables
**Targets:**
- users, subscriptions, landlords/property-groups, audit

**Modify:**
- Add horizontal scroll wrapper for data tables on small screens.
- Hide low-priority columns on mobile.
- Add mobile card/list fallback for very dense tables.

### B. Forms and filters
**Modify:**
- Convert filter rows to stacked layout on mobile (`grid-cols-1`) and multi-column on desktop.
- Ensure all inputs/buttons have min touch target height (`h-10` or more).
- Keep primary CTA full width on mobile where appropriate.

### C. Slide-over/dialog sizing
**Modify:**
- Use adaptive widths (`w-full sm:max-w-lg md:max-w-xl`).
- Keep internal scrolling inside dialog/sheet content.

### D. Charts/cards
**Modify:**
- Set responsive min-heights.
- Use stacked card layout on mobile, multi-column on desktop.

## 1.4 Definition of Done for Responsiveness
- Works cleanly at: `320px`, `375px`, `768px`, `1024px`, `1280px`.
- No horizontal scroll on page shell (except intentional table scroll areas).
- Sidebar and topbar actions remain usable on mobile.
- Core admin pages remain readable and actionable without pinch zoom.

---

## 2) Subscription Plans Module (Creation Scope)

## 2.1 Current State
- Backend already has **create** endpoint:
  - `POST /admin/subscription-plans`
  - files: `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin.service.ts`
- No complete frontend module/page for plan management yet.
- Current sidebar does not expose a `Subscription Plans` page.

## 2.2 Recommended Functional Scope (MVP)

### A. Plan List Page
**Route:** `/dashboard/subscription-plans`

**Capabilities:**
- List all plans
- Search by plan name
- Sort by price / limits / created date
- Status badge (active/inactive if supported)

### B. Create Plan
**Fields (from backend DTO + UX needs):**
- `name`
- `priceMonthly`
- `maxUnits`
- `maxProperties`

### C. Edit Plan
Recommended backend support:
- `PATCH /admin/subscription-plans/:id`

### D. Archive/Deactivate Plan
Recommended backend support:
- `PATCH /admin/subscription-plans/:id/status` or `DELETE` (soft delete preferred)

### E. Assign/Override Plan Flow (Optional but useful)
- From property group details, allow assign/change plan from plan catalog.

## 2.3 Frontend Files to Add

### API and hooks
- `frontend/src/lib/api/admin.api.ts`
  - `getSubscriptionPlans()`
  - `createSubscriptionPlan()` (already exists or add)
  - `updateSubscriptionPlan()`
  - `setSubscriptionPlanStatus()`
- `frontend/src/features/admin/hooks/useAdminSubscriptionPlans.ts`

### Feature components
- `frontend/src/features/admin/subscription-plans/SubscriptionPlansTable.tsx`
- `frontend/src/features/admin/subscription-plans/SubscriptionPlanFormSheet.tsx`
- `frontend/src/features/admin/subscription-plans/DeleteOrDeactivatePlanDialog.tsx`

### Page
- `frontend/app/(admin)/dashboard/subscription-plans/page.tsx`

### Validation
- Extend `frontend/src/lib/validations/admin.schema.ts` with `subscriptionPlanSchema`

## 2.4 Backend Additions Needed (to complete module)
- `GET /admin/subscription-plans` (list)
- `PATCH /admin/subscription-plans/:id` (update)
- Optional: status/deactivate endpoint
- Guardrails:
  - prevent duplicate plan names
  - prevent deleting plan if used by active subscriptions (or require migration)

## 2.5 Acceptance Criteria
- Admin can create, view, edit, and deactivate plans from UI.
- Form has validation and clear error messages.
- List updates using TanStack Query invalidation.
- Mobile/tablet behavior follows responsive standards above.

---

## 3) Sidebar Menu Review and Suggestions

## 3.1 Proposed Menu You Shared
- Dashboard
- Property Groups
- Subscriptions
- Subscription Plans
- Users
- Reports
- Settings
  - Roles
  - Menus

This is good and scalable. The only improvement needed is grouping/order for clearer mental model.

## 3.2 Recommended Information Architecture

### Option A (Flat, simple)
1. Dashboard
2. Property Groups
3. Users
4. Subscriptions
5. Subscription Plans
6. Reports
7. Settings

Settings children:
1. Roles
2. Menus

### Option B (Grouped, best for growth)
1. Dashboard
2. Management
   - Property Groups
   - Users
3. Billing
   - Subscriptions
   - Subscription Plans
4. Reports
5. Settings
   - Roles
   - Menus

**Selected for now:** use **Option A (Flat, simple)**.
**Future switch trigger:** move to Option B once more admin modules are added and the sidebar becomes crowded.

## 3.3 Naming Notes
- Keep `Subscriptions` for tenant/org subscriptions.
- Keep `Subscription Plans` for plan catalog/templates.
- If space is tight in sidebar, rename `Subscription Plans` -> `Plans`.

## 3.4 Routing Suggestion
- `/dashboard` -> Dashboard
- `/dashboard/property-groups` -> Property Groups
- `/dashboard/users` -> Users
- `/dashboard/subscriptions` -> Subscriptions
- `/dashboard/subscription-plans` -> Subscription Plans
- `/dashboard/reports` -> Reports
- `/dashboard/settings/roles` -> Roles
- `/dashboard/settings/menus` -> Menus

---

## 4) Implementation Order (Practical)
1. Stabilize responsive shell (Sidebar + TopBar + AppShell).
2. Apply responsive table/filter standards to existing admin pages.
3. Add backend list/update endpoints for subscription plans.
4. Build frontend Subscription Plans page + CRUD flows.
5. Update sidebar with grouped menu and active-route logic.
6. QA at required breakpoints and fix overflow/usability issues.

---

## 5) Quick Verdict on Your Sidebar
- Yes, your proposed sidebar items are correct.
- Add grouping to improve navigation clarity.
- Keep `Subscription Plans` separate from `Subscriptions` (different domain responsibilities).
