# :house: Landlord Frontend Gameplan (Web)

**Platform:** Web  
**Framework:** Next.js  
**Base Route:** /landlord  
**Auth Requirement:**
- role = USER
- userType = LANDLORD

**Scope:** property_group_id (organization-based)

---

## 1. Authentication & Organization Selection

### Pages
- /login
- /register
- /select-org (for multiple property groups)

---

## 2. Dashboard (/landlord/dashboard)

### KPI Cards
- Total Units
- Occupied vs Available
- Monthly Expected Rent
- Total Overdue Amount

### Alerts
- Overdue tenants
- Missing meter readings
- Subscription expiry warnings

---

## 3. Organization Settings (/landlord/org/settings)

### Sections
- Organization name
- Timezone
- Currency
- Billing defaults

### Members
- Invite members
- Assign roles (OWNER, ADMIN, STAFF)

---

## 4. Properties Management

### List Properties (/landlord/properties)
- Name
- Address
- Units count
- Occupancy rate

### Property Detail (/landlord/properties/[id])
Tabs:
- Units
- Tenants
- Leases
- Add-ons

---

## 5. Units Management

### Units List
- Unit name / number
- Type
- Monthly rent
- Status (Available, Occupied, Maintenance)

### Actions
- Edit unit details
- Assign add-ons
- Soft delete unit

---

## 6. Tenants Management

### Tenants List (/landlord/tenants)
- Name
- Unit
- Lease status
- Outstanding balance

### Tenant Detail (/landlord/tenants/[id])
Tabs:
- Profile
- Lease history
- Payments
- Notes

---

## 7. Lease Management

### Create Lease (/landlord/leases/new)
Steps:
1. Select available unit
2. Select tenant
3. Set rent amount
4. Billing day
5. Grace period
6. Advance / deposit

### Lease Detail (/landlord/leases/[id])
- Lease info
- Payment summary
- Close lease action

---

## 8. Payments & Billing

### Payments List (/landlord/payments)
Filters:
- Paid / Unpaid / Overdue
- Tenant
- Date range

### Payment Detail
- Itemized rent + add-ons
- Payment history
- Manual cash entry

---

## 9. Add-ons & Utilities

### Add-on Catalog (/landlord/addons)
- Platform add-ons
- Custom add-ons

### Meter Readings (/landlord/utilities)
- Enter readings
- Upload meter photo
- Auto bill computation

---

## 10. Reports (/landlord/reports)

- Monthly income
- Occupancy
- Tenant ledger

Export: PDF / Excel

---

## 11. Subscription (/landlord/subscription)

- Current plan
- Usage vs limits
- Upgrade plan
- Billing history

---

## 12. Build Priority

### Phase 1 (MVP)
- Dashboard
- Properties
- Units
- Tenants
- Leases
- Payments

### Phase 2
- Add-ons
- Utilities
- Notifications

### Phase 3
- Reports
- Subscription UI
- Multi-org switcher