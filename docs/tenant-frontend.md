# :adult: Tenant Frontend Gameplan (Web)

**Platform:** Web  
**Framework:** Next.js  
**Base Route:** /tenant  
**Auth Requirement:**
- role = USER
- userType = TENANT

---

## 1. Authentication

### Pages
- /tenant/login
- /tenant/register (invite-based)
- /tenant/forgot-password

---

## 2. Tenant Home (/tenant/home)

### Summary
- Current unit
- Property name
- Next due date
- Outstanding balance

### Status
- Paid
- Due
- Overdue

---

## 3. Bills & Payments (/tenant/bills)

### Bills List
- Billing month
- Rent
- Add-ons (itemized)
- Total amount
- Status

### Bill Detail (/tenant/bills/[paymentId])
- Full breakdown
- Payment options

---

## 4. Payment Flow

### Methods
- GCash
- Maya
- Card
- Cash (receipt upload)

### Flow
1. Initiate payment
2. Redirect to checkout
3. Webhook confirms payment
4. Status auto-updates

---

## 5. Receipts (/tenant/receipts)

- Downloadable PDF
- Payment reference
- Date and breakdown

---

## 6. Notifications (/tenant/notifications)

- New bill alerts
- Payment confirmation
- Overdue reminders

Features:
- Unread badge
- Mark as read

---

## 7. Profile (/tenant/profile)

- Contact info
- Emergency contact
- Change password

---

## 8. Build Priority

### Phase 1
- Login
- Home
- Bills
- Pay bill

### Phase 2
- Receipts
- Notifications

### Phase 3
- Profile
- Support / disputes