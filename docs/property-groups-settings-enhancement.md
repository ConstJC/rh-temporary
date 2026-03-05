# Property Groups + Settings Enhancements

## Scope
This document defines the next implementation updates for:
1. Property Groups detail/edit slider
2. Collapsible Settings menu in sidebar
3. Profile menu behavior and pages

---

## 1) Property Groups Changes

## 1.1 Update View Details Slider
Current component:
- `frontend/src/features/admin/landlords/PropertyGroupDetailSlideOver.tsx`

Required changes:
- Keep current organization, status, owner, counts, and joined sections.
- Add a new section: **Properties & Units**.
- For each property, show:
  - `propertyName`
  - `propertyType`
  - `address` (if available)
  - `unitCount`
  - unit status summary (available/occupied/maintenance/not available)
- Inside each property row/card, show a compact units list:
  - `unitName`
  - `unitType`
  - `status`
  - `monthlyRent`

Backend data requirement:
- Extend admin property-group details endpoint to return nested properties and units data.
- If current list endpoint is too heavy, add dedicated endpoint:
  - `GET /admin/property-groups/:id/details`

Frontend suggestion:
- Keep table lightweight; fetch full property/unit details only when opening slider.

## 1.2 Add Edit Button + Editable Slider
Current actions in table:
- `View`
- `Suspend/Reactivate`

Required changes:
- Add `Edit` button in:
  - `frontend/src/features/admin/landlords/LandlordsTableColumns.tsx`
- Reuse `PropertyGroupDetailSlideOver` with **view/edit modes** (or create separate `PropertyGroupEditSlideOver.tsx`).

Editable fields (minimum):
- `groupName`
- `currencyCode`
- `timezone`
- optional: status notes/internal notes

Save behavior:
- Add/update admin API endpoint:
  - `PATCH /admin/property-groups/:id`
- Validate with Zod schema in frontend.
- On success: close slider + invalidate property groups query.

## 1.3 UX Details
- Use read-only mode first, then switch to edit mode with button click.
- Show dirty state and unsaved changes prompt.
- Disable Save button while request is in progress.
- Keep slider responsive (`w-full sm:max-w-xl lg:max-w-2xl`) and scrollable.

---

## 2) Settings Menu Collapsible Sidebar

Current sidebar:
- `frontend/src/components/layout/Sidebar.tsx`
- Settings is a flat single item (`/dashboard/settings`).

Required changes:
- Make `Settings` a collapsible parent item.
- Child menu items:
  - `Roles` -> `/dashboard/settings/roles`
  - `Menus` -> `/dashboard/settings/menus`

Behavior:
- Expand/collapse by clicking parent Settings row.
- Auto-expand Settings section when current route starts with `/dashboard/settings`.
- In collapsed sidebar desktop mode, show only Settings icon and use tooltip/popover for children.
- In mobile drawer mode, show expanded children as indented list.

Accessibility:
- Parent toggle button should have:
  - `aria-expanded`
  - `aria-controls`
- Keyboard support for Enter/Space toggle.

---

## 3) Profile Click: What to Implement

Current profile action:
- `frontend/src/components/layout/TopBar.tsx`
- `Profile` click is placeholder.

Recommended implementation:

## 3.1 Profile Page (MVP)
Route:
- `/dashboard/profile`

Sections:
- **Basic Info**: first name, last name, email, phone
- **Account Info**: role, user type, email verified status
- **Security**:
  - change password form
  - recent login activity (optional)

Actions:
- Save profile changes
- Change password
- Logout all sessions (optional)

## 3.2 Profile Dropdown Enhancements
Add menu items:
- `My Profile` -> `/dashboard/profile`
- `Account Settings` -> `/dashboard/settings`
- `Logout`

Optional:
- `Switch Property Group` for non-admin users

## 3.3 API Requirements
- `GET /users/me` (or existing equivalent)
- `PATCH /users/me`
- `PATCH /auth/change-password`

Validation/security:
- Current password required for password change.
- Strong password policy in frontend and backend.

---

## 4) Suggested Implementation Order
1. Add backend details endpoint for property groups (with properties + units).
2. Update Property Group detail slider to show nested properties and units.
3. Add Edit action and editable slider flow.
4. Refactor sidebar Settings into collapsible parent with Roles/Menus children.
5. Implement Profile page and wire Profile dropdown navigation.

---

## 5) Acceptance Criteria
- Property Groups `View` slider shows full properties and units details.
- Property Groups has working `Edit` slider and updates persist.
- Sidebar Settings is collapsible with `Roles` and `Menus` child items.
- Profile click opens a real profile page with editable account info.
