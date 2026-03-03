# RentHub API Implementation Gameplan
**Generated:** 2026-03-03  
**Objective:** Complete all API endpoints across 4 phases (Phase 1 ✅ Complete)

---

## 🎯 Current Status: Phase 1 Complete (100%)

**Phase 1 (Core Backend)** is fully implemented with all 25 endpoints operational.

### What's Working Now:
✅ Authentication & authorization  
✅ Property group management  
✅ Properties & units CRUD  
✅ Tenant management  
✅ Lease lifecycle  
✅ Manual payment tracking  
✅ Automated monthly billing (CRON)  

---

## 📋 Implementation Roadmap

### Phase 1: Core Backend ✅ **COMPLETE**
**Status:** 25/25 endpoints (100%)  
**Timeline:** ✅ Done  
**Priority:** Critical - Foundation for all features

#### Modules Completed:
- ✅ **Auth Module** (7 endpoints) - Register, login, refresh, logout, verify email, forgot/reset password
- ✅ **Property Groups Module** (7 endpoints) - Org CRUD, members, subscription limits
- ✅ **Properties Module** (8 endpoints) - Property & unit CRUD with limit enforcement
- ✅ **Tenants Module** (4 endpoints) - Tenant CRUD with lease info
- ✅ **Leases Module** (5 endpoints) - Create, list, detail, update, close
- ✅ **Payments Module** (4 endpoints) - List, detail, manual recording, CRON billing

**Deliverables Achieved:**
- ✅ Two-layer RBAC (UserRole + UserType)
- ✅ Organization-level access control (OrgRole)
- ✅ Subscription limit enforcement
- ✅ Data scoping by property_group_id
- ✅ Automated monthly billing
- ✅ Audit trail logging

---

### Phase 2: Dashboard Features 🔄 **NEXT UP**
**Status:** 7/14 endpoints (50% - Admin module done early)  
**Estimated Timeline:** 2-3 weeks  
**Priority:** High - Required for full landlord dashboard

#### Remaining Work:

##### 1️⃣ Add-ons & Utility Readings Module (8 endpoints)
**Priority:** HIGH - Core billing feature

| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/addon-catalog` | GET | List available add-ons | Low |
| `/property-groups/:pgId/addon-catalog` | POST | Create custom add-on | Medium |
| `/units/:unitId/addons` | GET | Active add-ons for unit | Low |
| `/units/:unitId/addons` | POST | Assign add-on to unit | Medium |
| `/units/:unitId/addons/:addonId` | PATCH | Update add-on rate/status | Medium |
| `/leases/:leaseId/addon-bills` | GET | Lease add-on bills | Low |
| `/unit-addons/:addonId/readings` | POST | Enter meter reading | **High** |
| `/unit-addons/:addonId/readings` | GET | Reading history | Medium |

**Key Features:**
- Platform-wide addon catalog (WiFi, Water, Electricity, etc.)
- Custom org-specific addons
- FLAT_FEE vs METERED billing types
- Auto-compute units_consumed × rate for METERED
- Auto-create LeaseAddonBill on reading entry
- Rate override per unit

**Dependencies:**
- Database GENERATED columns for computed fields
- Prisma $queryRaw for reading GENERATED columns

**Estimated Effort:** 5-7 days

---

##### 2️⃣ Notifications Module (3 endpoints)
**Priority:** MEDIUM - Enhances UX

| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/me/notifications` | GET | List my notifications | Low |
| `/me/notifications/:id/read` | PATCH | Mark as read | Low |
| `/me/notifications/read-all` | PATCH | Bulk mark read | Low |

**Key Features:**
- Unified notification table (EMAIL, SMS, PUSH, IN_APP)
- Unread count in response meta
- Filter by read/unread status
- Triggered by: payment received, overdue, lease events

**Integration Points:**
- Payment service → create notification on payment
- Lease service → create notification on lease events
- CRON job → create overdue notifications

**Estimated Effort:** 2-3 days

---

##### 3️⃣ Admin Module ✅ **ALREADY DONE**
All 7 admin endpoints are implemented ahead of schedule:
- ✅ `/admin/users` (GET, PATCH)
- ✅ `/admin/property-groups` (GET, PATCH)
- ✅ `/admin/subscriptions` (GET)
- ✅ `/admin/subscription-plans` (POST)
- ✅ `/admin/audit` (GET)

---

##### 4️⃣ Tenant Portal Invite (1 endpoint)
**Priority:** MEDIUM - Enables tenant onboarding

| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/tenants/:id/invite` | POST | Send portal invite | Medium |

**Key Features:**
- Generate invite token
- Send email with magic link
- On accept: set tenant.userId + userType=TENANT
- Create User account if email doesn't exist

**Estimated Effort:** 1-2 days

---

**Phase 2 Total Estimated Effort:** 8-12 days (1.5-2.5 weeks)

**Recommended Build Order:**
1. Notifications Module (foundation for alerts)
2. Tenant Portal Invite (enables tenant accounts)
3. Add-ons & Utility Readings (most complex, highest value)

---

### Phase 3: E-Payment Integration 💳 **FUTURE**
**Status:** 0/8 endpoints (0%)  
**Estimated Timeline:** 2-3 weeks  
**Priority:** Medium - Revenue enabler

#### Endpoints to Build:

##### PayMongo Integration (2 endpoints)
| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/payments/:id/initiate` | POST | Create PayMongo payment intent | **High** |
| `/payments/webhook` | POST | PayMongo webhook callback | **High** |

**Key Features:**
- PayMongo SDK integration
- Payment intent creation (GCash, Maya, Card)
- Idempotency-Key header handling
- Webhook signature verification
- Transaction state machine (PENDING → SUCCESS/FAILED)
- Automatic payment status update on webhook
- Duplicate webhook prevention

**Dependencies:**
- PayMongo account & API keys
- Webhook endpoint configuration
- SSL certificate for webhook URL
- PAYMENT_TRANSACTIONS table

**Estimated Effort:** 7-10 days

---

##### Receipt & Transaction Endpoints (6 endpoints)
| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/payments/:id/transactions` | GET | Payment transaction history | Low |
| `/payments/:id/receipt` | GET | Generate receipt PDF | Medium |
| `/leases/:leaseId/receipts` | GET | All receipts for lease | Low |
| `/me/receipts` | GET | Tenant receipt history | Low |
| `/payments/:id/refund` | POST | Initiate refund | High |
| `/payments/:id/retry` | POST | Retry failed payment | Medium |

**Estimated Effort:** 5-7 days

**Phase 3 Total Estimated Effort:** 12-17 days (2.5-3.5 weeks)

---

### Phase 4: Mobile & Tenant Portal 📱 **FUTURE**
**Status:** 0/12 endpoints (0%)  
**Estimated Timeline:** 2-3 weeks  
**Priority:** Low - Tenant-facing features

#### Tenant Portal (`/me/*`) - 8 endpoints

| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/me` | GET | My profile + active lease | Low |
| `/me` | PATCH | Update profile | Low |
| `/me/leases` | GET | My lease history | Low |
| `/me/payments` | GET | My bills | Low |
| `/me/addresses` | GET | My saved addresses | Low |
| `/me/addresses` | POST | Add address | Low |
| `/me/addresses/:id` | PATCH | Update address | Low |
| `/me/addresses/:id` | DELETE | Delete address | Low |

**Key Features:**
- Tenant-scoped data access
- Active lease summary (unit, next due, total due)
- Itemized bill view (rent + add-ons)
- Payment history
- Address management for delivery

**Estimated Effort:** 4-6 days

---

#### Marketplace/Explore - 3 endpoints

| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/explore/units` | GET | Browse available units | Medium |
| `/explore/units/:unitId` | GET | Unit detail (public) | Low |
| `/explore/units/:unitId/inquire` | POST | Submit inquiry | Low |

**Key Features:**
- Public (no auth) endpoints
- Filter by city, type, price, amenities
- Featured units first
- Hide internal landlord data
- Create notification for landlord on inquiry

**Estimated Effort:** 3-4 days

---

#### Push Notifications (1 endpoint)

| Endpoint | Method | Description | Complexity |
|----------|--------|-------------|------------|
| `/me/fcm-token` | POST | Register FCM token | Low |

**Dependencies:**
- Firebase Cloud Messaging setup
- Mobile app integration

**Estimated Effort:** 2-3 days

**Phase 4 Total Estimated Effort:** 9-13 days (2-2.5 weeks)

---

## 🗓️ Recommended Implementation Timeline

### Sprint 1-2: Phase 2 Completion (Weeks 1-2)
**Goal:** Complete dashboard features

- **Week 1:**
  - Day 1-2: Notifications Module (3 endpoints)
  - Day 3-4: Tenant Portal Invite (1 endpoint)
  - Day 5: Testing & integration

- **Week 2:**
  - Day 1-5: Add-ons & Utility Readings Module (8 endpoints)
  - Focus on meter reading computation logic
  - Test FLAT_FEE vs METERED billing

**Deliverable:** Full landlord dashboard functionality

---

### Sprint 3-4: Phase 3 E-Payment (Weeks 3-4)
**Goal:** Enable online payments

- **Week 3:**
  - Day 1-3: PayMongo SDK integration
  - Day 4-5: Payment initiation endpoint + testing

- **Week 4:**
  - Day 1-3: Webhook handling + idempotency
  - Day 4-5: Receipt generation & transaction history

**Deliverable:** Live e-payment processing

---

### Sprint 5-6: Phase 4 Mobile/Tenant Portal (Weeks 5-6)
**Goal:** Launch tenant-facing features

- **Week 5:**
  - Day 1-3: Tenant portal endpoints (`/me/*`)
  - Day 4-5: Marketplace/Explore endpoints

- **Week 6:**
  - Day 1-2: Push notification setup
  - Day 3-5: End-to-end testing + bug fixes

**Deliverable:** Complete tenant mobile experience

---

## 🎯 Immediate Next Actions (Phase 2 Start)

### 1. Notifications Module Setup
**Priority:** Start here - foundation for all alerts

```bash
# Create module structure
nest g module notifications
nest g service notifications
nest g controller notifications

# Create DTOs
- create-notification.dto.ts
- list-notifications-query.dto.ts
```

**Implementation Steps:**
1. Create NotificationsService with CRUD methods
2. Add `findByUser()` with unread count
3. Add `markAsRead()` and `markAllAsRead()`
4. Create NotificationsController with 3 endpoints
5. Integrate notification creation in PaymentsService
6. Integrate notification creation in LeasesService
7. Test notification flow end-to-end

---

### 2. Tenant Portal Invite
**Priority:** Do this second - enables tenant accounts

**Implementation Steps:**
1. Add `inviteToken` and `inviteExpires` to Tenants table
2. Create `sendInvite()` method in TenantsService
3. Generate secure token (crypto.randomBytes)
4. Send email with invite link
5. Create `/auth/accept-invite` endpoint
6. On accept: create User (if needed) + link to Tenant
7. Test invite flow end-to-end

---

### 3. Add-ons & Utility Readings Module
**Priority:** Most complex - save for last in Phase 2

**Database Preparation:**
1. Verify GENERATED columns in schema:
   - `units_consumed` in UTILITY_READINGS
   - `amount_computed` in UTILITY_READINGS
2. Test $queryRaw for reading GENERATED columns

**Implementation Steps:**
1. Create AddonCatalogService (platform + custom addons)
2. Create UnitAddonsService (assign, update, list)
3. Create UtilityReadingsService (enter reading, auto-compute)
4. Create LeaseAddonBillsService (generate bills)
5. Integrate with PaymentsCron (FLAT_FEE bills)
6. Create controllers for all endpoints
7. Test METERED billing computation
8. Test FLAT_FEE billing generation

---

## 🧪 Testing Strategy

### Phase 2 Testing Checklist
- [ ] Notification creation on payment received
- [ ] Notification creation on lease events
- [ ] Unread count accuracy
- [ ] Bulk mark-read performance
- [ ] Tenant invite email delivery
- [ ] Invite token expiration
- [ ] User account creation on invite accept
- [ ] Add-on catalog filtering
- [ ] Custom add-on creation
- [ ] Unit add-on assignment
- [ ] Meter reading computation (GENERATED columns)
- [ ] LeaseAddonBill auto-creation
- [ ] FLAT_FEE vs METERED billing accuracy

### Integration Tests
- [ ] Complete lease flow with add-ons
- [ ] Monthly billing with add-ons
- [ ] Tenant invite → login → view bills
- [ ] Notification delivery on all events

---

## 📊 Success Metrics

### Phase 2 Completion Criteria
- [ ] All 14 endpoints implemented and tested
- [ ] Notifications triggered on all key events
- [ ] Tenant invite flow working end-to-end
- [ ] Add-on billing accurate (FLAT_FEE + METERED)
- [ ] Meter reading computation correct
- [ ] No regressions in Phase 1 functionality
- [ ] API documentation updated
- [ ] Integration tests passing

### Phase 3 Completion Criteria
- [ ] PayMongo integration live
- [ ] Webhook handling robust (idempotency)
- [ ] Payment status updates automatic
- [ ] Receipt generation working
- [ ] Transaction history accurate
- [ ] Error handling for payment failures

### Phase 4 Completion Criteria
- [ ] Tenant portal fully functional
- [ ] Marketplace browsing working
- [ ] Push notifications delivering
- [ ] Mobile app integrated
- [ ] End-to-end tenant journey tested

---

## 🚨 Risk Mitigation

### Technical Risks

**Risk 1: GENERATED Column Access**
- **Impact:** Cannot read computed utility amounts
- **Mitigation:** Use Prisma $queryRaw for GENERATED columns
- **Fallback:** Compute in application layer if needed

**Risk 2: PayMongo Webhook Reliability**
- **Impact:** Payment status not updated
- **Mitigation:** Implement idempotency + retry logic
- **Fallback:** Manual payment reconciliation dashboard

**Risk 3: Email Delivery Failures**
- **Impact:** Invites/notifications not received
- **Mitigation:** Use reliable email service (SendGrid/Mailgun)
- **Fallback:** SMS backup channel

### Business Risks

**Risk 1: Subscription Limit Enforcement**
- **Status:** ✅ Already implemented in Phase 1
- **Validation:** Test limit checks on all create operations

**Risk 2: Data Isolation**
- **Status:** ✅ property_group_id scoping implemented
- **Validation:** Integration tests verify no cross-org access

**Risk 3: Payment Accuracy**
- **Impact:** Incorrect billing amounts
- **Mitigation:** Comprehensive test suite for billing logic
- **Validation:** Manual QA on staging environment

---

## 📝 Documentation Requirements

### Before Phase 2 Start
- [x] Phase 1 status report ✅
- [x] API implementation gameplan ✅
- [ ] Postman collection for Phase 1 endpoints
- [ ] Environment setup guide
- [ ] Database seeding script

### During Phase 2
- [ ] Add-on billing logic documentation
- [ ] Meter reading computation examples
- [ ] Notification event triggers map
- [ ] Tenant invite flow diagram

### Before Production
- [ ] API versioning strategy
- [ ] Rate limiting configuration
- [ ] Monitoring & alerting setup
- [ ] Backup & disaster recovery plan
- [ ] Security audit checklist

---

## 🎉 Conclusion

**Phase 1 is complete and production-ready.** The core backend provides all essential landlord functionality.

**Next milestone:** Complete Phase 2 (Dashboard Features) in 2-3 weeks to enable:
- Add-on billing (WiFi, utilities, parking)
- Meter reading tracking
- Notification system
- Tenant portal invites

**Long-term roadmap:** Phases 3-4 will add e-payment integration and tenant mobile portal, completing the full SaaS platform.

**Recommended approach:** Focus on Phase 2 completion before starting Phase 3. Each phase builds on the previous, and Phase 2 provides critical dashboard features for landlords.

---

**Last Updated:** 2026-03-03  
**Next Review:** After Phase 2 completion
