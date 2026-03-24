import 'dotenv/config'
import { PrismaClient, UserRole, UserType, PropertyType, UnitType, UnitStatus, SubscriptionStatus } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'

// ── Prisma v7: adapter is required ──────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const planSeedRecords = [
    {
        planName: 'Free',
        priceMonthly: 0,
        propertyLimit: 1,
        unitLimit: 20,
        unitLimitPerProperty: 20,
        tenantLimit: 20,
    },
    {
        planName: 'Basic',
        priceMonthly: 499,
        propertyLimit: 3,
        unitLimit: 150,
        unitLimitPerProperty: 50,
        tenantLimit: 120,
    },
    {
        planName: 'Pro',
        priceMonthly: 999,
        propertyLimit: 10,
        unitLimit: 600,
        unitLimitPerProperty: 120,
        tenantLimit: 500,
    },
    {
        planName: 'Business',
        priceMonthly: 1799,
        propertyLimit: 30,
        unitLimit: 2500,
        unitLimitPerProperty: 300,
        tenantLimit: 2000,
    },
    {
        planName: 'Enterprise',
        priceMonthly: 2499,
        propertyLimit: 0,
        unitLimit: 0,
        unitLimitPerProperty: 0,
        tenantLimit: 0,
    },
] as const

const menuCatalogSeed = [
    { code: 'LANDLORD_DASHBOARD', label: 'Dashboard', routePattern: '/:pgId/overview', sortOrder: 10 },
    { code: 'LANDLORD_PROPERTIES', label: 'Properties', routePattern: '/:pgId/properties*', sortOrder: 20 },
    { code: 'LANDLORD_TENANTS', label: 'Tenants', routePattern: '/:pgId/tenants*', sortOrder: 30 },
    { code: 'LANDLORD_LEASES', label: 'Tenant Leases', routePattern: '/:pgId/leases*', sortOrder: 40 },
    { code: 'LANDLORD_PAYMENTS', label: 'Payments', routePattern: '/:pgId/payments*', sortOrder: 50 },
    { code: 'LANDLORD_ADDONS', label: 'Add-ons', routePattern: '/:pgId/addons*', sortOrder: 60 },
    { code: 'LANDLORD_UTILITIES', label: 'Utilities', routePattern: '/:pgId/utilities*', sortOrder: 70 },
    { code: 'LANDLORD_REPORTS', label: 'Reports', routePattern: '/:pgId/reports*', sortOrder: 80 },
    { code: 'LANDLORD_SUBSCRIPTION', label: 'Subscription', routePattern: '/:pgId/subscription*', sortOrder: 90 },
    { code: 'LANDLORD_SETTINGS', label: 'Settings', routePattern: '/:pgId/settings*', sortOrder: 100 },
] as const

const permissionCatalogSeed = [
    { moduleCode: 'PROPERTIES', code: 'PROPERTY_VIEW', action: 'VIEW' },
    { moduleCode: 'PROPERTIES', code: 'PROPERTY_CREATE', action: 'CREATE' },
    { moduleCode: 'PROPERTIES', code: 'PROPERTY_UPDATE', action: 'UPDATE' },
    { moduleCode: 'PROPERTIES', code: 'PROPERTY_DELETE', action: 'DELETE' },
    { moduleCode: 'UNITS', code: 'UNIT_VIEW', action: 'VIEW' },
    { moduleCode: 'UNITS', code: 'UNIT_CREATE', action: 'CREATE' },
    { moduleCode: 'UNITS', code: 'UNIT_UPDATE', action: 'UPDATE' },
    { moduleCode: 'UNITS', code: 'UNIT_DELETE', action: 'DELETE' },
    { moduleCode: 'TENANTS', code: 'TENANT_VIEW', action: 'VIEW' },
    { moduleCode: 'TENANTS', code: 'TENANT_CREATE', action: 'CREATE' },
    { moduleCode: 'TENANTS', code: 'TENANT_UPDATE', action: 'UPDATE' },
    { moduleCode: 'TENANTS', code: 'TENANT_DELETE', action: 'DELETE' },
    { moduleCode: 'LEASES', code: 'LEASE_VIEW', action: 'VIEW' },
    { moduleCode: 'LEASES', code: 'LEASE_CREATE', action: 'CREATE' },
    { moduleCode: 'LEASES', code: 'LEASE_UPDATE', action: 'UPDATE' },
    { moduleCode: 'LEASES', code: 'LEASE_CLOSE', action: 'CLOSE' },
    { moduleCode: 'PAYMENTS', code: 'PAYMENT_VIEW', action: 'VIEW' },
    { moduleCode: 'PAYMENTS', code: 'PAYMENT_RECORD_MANUAL', action: 'RECORD_MANUAL' },
    { moduleCode: 'ADDONS', code: 'ADDON_VIEW', action: 'VIEW' },
    { moduleCode: 'ADDONS', code: 'ADDON_MANAGE', action: 'MANAGE' },
    { moduleCode: 'UTILITIES', code: 'UTILITY_READING_VIEW', action: 'VIEW' },
    { moduleCode: 'UTILITIES', code: 'UTILITY_READING_RECORD', action: 'RECORD' },
    { moduleCode: 'REPORTS', code: 'REPORT_VIEW', action: 'VIEW' },
    { moduleCode: 'REPORTS', code: 'REPORT_EXPORT', action: 'EXPORT' },
    { moduleCode: 'MEMBERS', code: 'MEMBER_VIEW', action: 'VIEW' },
    { moduleCode: 'MEMBERS', code: 'MEMBER_INVITE', action: 'INVITE' },
    { moduleCode: 'MEMBERS', code: 'MEMBER_ROLE_UPDATE', action: 'ROLE_UPDATE' },
] as const

const freeMenuCodes = [
    'LANDLORD_DASHBOARD',
    'LANDLORD_PROPERTIES',
    'LANDLORD_TENANTS',
    'LANDLORD_LEASES',
    'LANDLORD_SUBSCRIPTION',
] as const

const proMenuCodes = [...freeMenuCodes, 'LANDLORD_PAYMENTS', 'LANDLORD_ADDONS', 'LANDLORD_UTILITIES'] as const
const businessMenuCodes = [...proMenuCodes, 'LANDLORD_REPORTS', 'LANDLORD_SETTINGS'] as const

const freePermissionCodes = [
    'PROPERTY_VIEW',
    'PROPERTY_CREATE',
    'PROPERTY_UPDATE',
    'UNIT_VIEW',
    'UNIT_CREATE',
    'UNIT_UPDATE',
    'TENANT_VIEW',
    'TENANT_CREATE',
    'TENANT_UPDATE',
    'LEASE_VIEW',
    'LEASE_CREATE',
    'LEASE_UPDATE',
] as const

const basicPermissionCodes = [...freePermissionCodes, 'PROPERTY_DELETE', 'UNIT_DELETE', 'TENANT_DELETE'] as const
const proPermissionCodes = [
    ...basicPermissionCodes,
    'PAYMENT_VIEW',
    'PAYMENT_RECORD_MANUAL',
    'ADDON_VIEW',
    'ADDON_MANAGE',
    'UTILITY_READING_VIEW',
    'UTILITY_READING_RECORD',
] as const

const businessPermissionCodes = [
    ...proPermissionCodes,
    'REPORT_VIEW',
    'REPORT_EXPORT',
    'MEMBER_VIEW',
    'MEMBER_INVITE',
    'MEMBER_ROLE_UPDATE',
] as const

const planMenuMatrix: Record<string, readonly string[]> = {
    Free: freeMenuCodes,
    Basic: freeMenuCodes,
    Pro: proMenuCodes,
    Business: businessMenuCodes,
    Enterprise: menuCatalogSeed.map((menu) => menu.code),
}

const planPermissionMatrix: Record<string, readonly string[]> = {
    Free: freePermissionCodes,
    Basic: basicPermissionCodes,
    Pro: proPermissionCodes,
    Business: businessPermissionCodes,
    Enterprise: permissionCatalogSeed.map((permission) => permission.code),
}

async function main() {
    console.log('🌱  Starting RentHub seed...\n')

    // ── 1. Clean slate (reverse dependency order) ──────────────────────────────
    console.log('🗑   Cleaning existing data...')
    await prisma.utilityReading.deleteMany()
    await prisma.leaseAddonBill.deleteMany()
    await prisma.unitAddon.deleteMany()
    await prisma.unitAddonCatalog.deleteMany()
    await prisma.paymentTransaction.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.lease.deleteMany()
    await prisma.tenant.deleteMany()
    await prisma.unit.deleteMany()
    await prisma.property.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.subscriptionPlanPermission.deleteMany()
    await prisma.subscriptionPlanMenu.deleteMany()
    await prisma.featurePermission.deleteMany()
    await prisma.featureMenu.deleteMany()
    await prisma.subscriptionPlan.deleteMany()
    await prisma.propertyGroupMember.deleteMany()
    await prisma.propertyGroup.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.auditTrail.deleteMany()
    await prisma.userAddress.deleteMany()
    await prisma.user.deleteMany()
    await prisma.orgRole.deleteMany()
    console.log('   ✓ Clean\n')

    const HASH = await bcrypt.hash('password', 12)

    // ── 2. Org Roles ───────────────────────────────────────────────────────────
    console.log('🔑  Creating org roles...')
    const roleOwner = await prisma.orgRole.create({ data: { code: 'OWNER', name: 'Property Owner' } })
    const roleAdmin = await prisma.orgRole.create({ data: { code: 'ADMIN', name: 'Administrator' } })
    await prisma.orgRole.create({ data: { code: 'STAFF', name: 'Staff Member' } })
    console.log('   ✓ 3 org roles\n')

    // ── 3. Subscription Plans + Access Catalog ────────────────────────────────
    console.log('💳  Creating canonical subscription plans and access catalogs...')

    const plans = await Promise.all(
        planSeedRecords.map((plan) =>
            prisma.subscriptionPlan.upsert({
                where: { planName: plan.planName },
                create: {
                    planName: plan.planName,
                    priceMonthly: plan.priceMonthly,
                    propertyLimit: plan.propertyLimit,
                    unitLimit: plan.unitLimit,
                    unitLimitPerProperty: plan.unitLimitPerProperty,
                    tenantLimit: plan.tenantLimit,
                    accessPolicyVersion: 1,
                },
                update: {
                    priceMonthly: plan.priceMonthly,
                    propertyLimit: plan.propertyLimit,
                    unitLimit: plan.unitLimit,
                    unitLimitPerProperty: plan.unitLimitPerProperty,
                    tenantLimit: plan.tenantLimit,
                    accessPolicyVersion: 1,
                    deletedAt: null,
                },
            }),
        ),
    )

    const featureMenus = await Promise.all(
        menuCatalogSeed.map((menu) =>
            prisma.featureMenu.upsert({
                where: { code: menu.code },
                create: {
                    code: menu.code,
                    label: menu.label,
                    routePattern: menu.routePattern,
                    sortOrder: menu.sortOrder,
                    isActive: true,
                },
                update: {
                    label: menu.label,
                    routePattern: menu.routePattern,
                    sortOrder: menu.sortOrder,
                    isActive: true,
                    deletedAt: null,
                },
            }),
        ),
    )

    const featurePermissions = await Promise.all(
        permissionCatalogSeed.map((permission) =>
            prisma.featurePermission.upsert({
                where: { code: permission.code },
                create: {
                    code: permission.code,
                    moduleCode: permission.moduleCode,
                    action: permission.action,
                    description: `${permission.moduleCode} ${permission.action}`,
                    isActive: true,
                },
                update: {
                    moduleCode: permission.moduleCode,
                    action: permission.action,
                    description: `${permission.moduleCode} ${permission.action}`,
                    isActive: true,
                    deletedAt: null,
                },
            }),
        ),
    )

    const planByName = new Map(plans.map((plan) => [plan.planName, plan]))
    const menuByCode = new Map(featureMenus.map((menu) => [menu.code, menu]))
    const permissionByCode = new Map(featurePermissions.map((permission) => [permission.code, permission]))

    await prisma.subscriptionPlanMenu.deleteMany()
    await prisma.subscriptionPlanPermission.deleteMany()

    const menuMappings = Object.entries(planMenuMatrix).flatMap(([planName, menuCodes]) => {
        const plan = planByName.get(planName)
        if (!plan) {
            throw new Error(`Missing seeded subscription plan: ${planName}`)
        }

        return menuCodes.map((menuCode) => {
            const menu = menuByCode.get(menuCode)
            if (!menu) {
                throw new Error(`Missing seeded menu code: ${menuCode}`)
            }
            return {
                subscriptionPlanId: plan.id,
                menuId: menu.id,
                isEnabled: true,
            }
        })
    })

    const permissionMappings = Object.entries(planPermissionMatrix).flatMap(([planName, permissionCodes]) => {
        const plan = planByName.get(planName)
        if (!plan) {
            throw new Error(`Missing seeded subscription plan: ${planName}`)
        }

        return permissionCodes.map((permissionCode) => {
            const permission = permissionByCode.get(permissionCode)
            if (!permission) {
                throw new Error(`Missing seeded permission code: ${permissionCode}`)
            }
            return {
                subscriptionPlanId: plan.id,
                permissionId: permission.id,
                isEnabled: true,
            }
        })
    })

    if (menuMappings.length > 0) {
        await prisma.subscriptionPlanMenu.createMany({ data: menuMappings })
    }
    if (permissionMappings.length > 0) {
        await prisma.subscriptionPlanPermission.createMany({ data: permissionMappings })
    }

    const planFree = planByName.get('Free')
    const planBasic = planByName.get('Basic')
    if (!planFree || !planBasic) {
        throw new Error('Missing required seeded plans: Free and Basic')
    }

    console.log('   ✓ 5 plans (Free · Basic · Pro · Business · Enterprise)')
    console.log(`   ✓ ${featureMenus.length} menu catalog rows`)
    console.log(`   ✓ ${featurePermissions.length} permission catalog rows`)
    console.log(`   ✓ ${menuMappings.length} plan-menu mappings`)
    console.log(`   ✓ ${permissionMappings.length} plan-permission mappings\n`)

    // ── 4. Users ───────────────────────────────────────────────────────────────
    console.log('👤  Creating users...')

    await prisma.user.create({
        data: {
            email: 'admin@renthub.com', password: HASH,
            firstName: 'System', lastName: 'Admin',
            role: UserRole.ADMIN, userType: UserType.SYSTEM_ADMIN,
            isEmailVerified: true,
        },
    })

    const landlord1 = await prisma.user.create({
        data: {
            email: 'landlord1@renthub.com', password: HASH,
            firstName: 'Juan', lastName: 'dela Cruz',
            role: UserRole.USER, userType: UserType.LANDLORD,
            phone: '09171234567', isEmailVerified: true,
        },
    })

    const landlord2 = await prisma.user.create({
        data: {
            email: 'landlord2@renthub.com', password: HASH,
            firstName: 'Maria', lastName: 'Santos',
            role: UserRole.USER, userType: UserType.LANDLORD,
            phone: '09181234567', isEmailVerified: true,
        },
    })

    const staffUser = await prisma.user.create({
        data: {
            email: 'staff@renthub.com', password: HASH,
            firstName: 'Pedro', lastName: 'Reyes',
            role: UserRole.USER, userType: UserType.LANDLORD,
            phone: '09191234567', isEmailVerified: true,
        },
    })

    const tenantUser1 = await prisma.user.create({
        data: {
            email: 'tenant1@renthub.com', password: HASH,
            firstName: 'Ana', lastName: 'Garcia',
            role: UserRole.USER, userType: UserType.TENANT,
            phone: '09201234567', isEmailVerified: true,
        },
    })

    const tenantUser2 = await prisma.user.create({
        data: {
            email: 'tenant2@renthub.com', password: HASH,
            firstName: 'Jose', lastName: 'Mendoza',
            role: UserRole.USER, userType: UserType.TENANT,
            phone: '09211234567', isEmailVerified: true,
        },
    })

    console.log('   ✓ 6 users\n')

    // ── 5. Property Groups ─────────────────────────────────────────────────────
    console.log('🏢  Creating property groups...')

    const pg1 = await prisma.propertyGroup.create({
        data: { groupName: 'dela Cruz Properties', currencyCode: 'PHP', timezone: 'Asia/Manila', createdBy: landlord1.id },
    })

    const pg2 = await prisma.propertyGroup.create({
        data: { groupName: 'Santos Residences', currencyCode: 'PHP', timezone: 'Asia/Manila', createdBy: landlord2.id },
    })

    console.log('   ✓ 2 property groups\n')

    // ── 6. Members ─────────────────────────────────────────────────────────────
    console.log('👥  Assigning members...')

    await prisma.propertyGroupMember.createMany({
        data: [
            { propertyGroupId: pg1.id, userId: landlord1.id, roleId: roleOwner.id },
            { propertyGroupId: pg1.id, userId: staffUser.id, roleId: roleAdmin.id },
            { propertyGroupId: pg2.id, userId: landlord2.id, roleId: roleOwner.id },
        ],
    })

    console.log('   ✓ 3 members\n')

    // ── 7. Subscriptions ───────────────────────────────────────────────────────
    console.log('📋  Creating subscriptions...')

    await prisma.subscription.createMany({
        data: [
            {
                propertyGroupId: pg1.id, subscriptionPlanId: planBasic.id,
                startedAt: new Date('2026-01-01'), status: SubscriptionStatus.ACTIVE,
            },
            {
                propertyGroupId: pg2.id, subscriptionPlanId: planFree.id,
                startedAt: new Date('2026-01-15'), status: SubscriptionStatus.ACTIVE,
            },
        ],
    })

    console.log('   ✓ 2 subscriptions\n')

    // ── 8. Properties ──────────────────────────────────────────────────────────
    console.log('🏠  Creating properties...')

    const prop1 = await prisma.property.create({
        data: {
            propertyGroupId: pg1.id,
            propertyType: PropertyType.BOARDING_HOUSE,
            propertyName: 'DC Pension House',
            addressLine: '123 Rizal Street, Brgy. Silangan',
            city: 'Quezon City',
            province: 'Metro Manila',
            postalCode: '1100',
            metadata: { amenities: ['WiFi', 'CCTV', 'Laundry Area'], floors: 2 },
        },
    })

    const prop2 = await prisma.property.create({
        data: {
            propertyGroupId: pg1.id,
            propertyType: PropertyType.APARTMENT_BUILDING,
            propertyName: 'dela Cruz Apartments',
            addressLine: '456 Mabini Avenue, Brgy. Batasan',
            city: 'Quezon City',
            province: 'Metro Manila',
            postalCode: '1126',
            metadata: { amenities: ['Parking', 'Security Guard', 'Elevator'], floors: 4 },
        },
    })

    const prop3 = await prisma.property.create({
        data: {
            propertyGroupId: pg2.id,
            propertyType: PropertyType.BOARDING_HOUSE,
            propertyName: 'Santos Boarding House',
            addressLine: '789 Luna Street, Brgy. Payatas',
            city: 'Quezon City',
            province: 'Metro Manila',
            postalCode: '1119',
            metadata: { amenities: ['WiFi', 'Common Kitchen'], floors: 2 },
        },
    })

    console.log('   ✓ 3 properties\n')

    // ── 9. Units ───────────────────────────────────────────────────────────────
    console.log('🚪  Creating units...')

    // prop1 — DC Pension House
    const unit1 = await prisma.unit.create({
        data: {
            propertyId: prop1.id, unitType: UnitType.BEDROOM,
            unitName: 'Room 101', monthlyRent: 3500, floorNumber: 1,
            maxOccupants: 2, status: UnitStatus.OCCUPIED,
            metadata: { furnished: true, sqm: 15, air_conditioned: false },
        },
    })

    const unit2 = await prisma.unit.create({
        data: {
            propertyId: prop1.id, unitType: UnitType.BEDROOM,
            unitName: 'Room 102', monthlyRent: 3500, floorNumber: 1,
            maxOccupants: 2, status: UnitStatus.OCCUPIED,
            metadata: { furnished: true, sqm: 15, air_conditioned: false },
        },
    })

    await prisma.unit.create({
        data: {
            propertyId: prop1.id, unitType: UnitType.BEDROOM,
            unitName: 'Room 103', monthlyRent: 3800, floorNumber: 1,
            maxOccupants: 2, status: UnitStatus.AVAILABLE,
            metadata: { furnished: true, sqm: 18, air_conditioned: true },
        },
    })

    await prisma.unit.create({
        data: {
            propertyId: prop1.id, unitType: UnitType.BEDROOM,
            unitName: 'Room 201', monthlyRent: 4000, floorNumber: 2,
            maxOccupants: 2, status: UnitStatus.AVAILABLE,
            metadata: { furnished: true, sqm: 20, air_conditioned: true },
        },
    })

    await prisma.unit.create({
        data: {
            propertyId: prop1.id, unitType: UnitType.BEDROOM,
            unitName: 'Room 202', monthlyRent: 4000, floorNumber: 2,
            maxOccupants: 2, status: UnitStatus.MAINTENANCE,
            metadata: { furnished: false, sqm: 20, air_conditioned: false },
        },
    })

    const unit6 = await prisma.unit.create({
        data: {
            propertyId: prop1.id, unitType: UnitType.SHARED_ROOM,
            unitName: 'Dorm A (6-bed)', monthlyRent: 1800, floorNumber: 2,
            maxOccupants: 6, status: UnitStatus.OCCUPIED,
            metadata: { furnished: true, sqm: 35, air_conditioned: false, beds: 6 },
        },
    })

    // prop2 — dela Cruz Apartments
    const unit7 = await prisma.unit.create({
        data: {
            propertyId: prop2.id, unitType: UnitType.STUDIO,
            unitName: 'Studio 1A', monthlyRent: 8500, floorNumber: 1,
            maxOccupants: 2, status: UnitStatus.OCCUPIED,
            isFeatured: true,
            metadata: { furnished: true, sqm: 28, air_conditioned: true, parking: false },
        },
    })

    await prisma.unit.create({
        data: {
            propertyId: prop2.id, unitType: UnitType.STUDIO,
            unitName: 'Studio 2A', monthlyRent: 8500, floorNumber: 2,
            maxOccupants: 2, status: UnitStatus.AVAILABLE,
            isFeatured: true,
            metadata: { furnished: true, sqm: 28, air_conditioned: true, parking: false },
        },
    })

    // prop3 — Santos Boarding House
    const unit9 = await prisma.unit.create({
        data: {
            propertyId: prop3.id, unitType: UnitType.BEDROOM,
            unitName: 'Room A', monthlyRent: 3000, floorNumber: 1,
            maxOccupants: 1, status: UnitStatus.OCCUPIED,
            metadata: { furnished: false, sqm: 12, air_conditioned: false },
        },
    })

    await prisma.unit.create({
        data: {
            propertyId: prop3.id, unitType: UnitType.BEDROOM,
            unitName: 'Room B', monthlyRent: 3000, floorNumber: 1,
            maxOccupants: 1, status: UnitStatus.AVAILABLE,
            metadata: { furnished: false, sqm: 12, air_conditioned: false },
        },
    })

    console.log('   ✓ 10 units\n')

    // ── 10. Addon Catalog (platform-wide) ──────────────────────────────────────
    console.log('⚡  Creating addon catalog...')

    const addonWifi = await prisma.unitAddonCatalog.create({
        data: {
            name: 'WiFi Internet', category: 'internet',
            billingType: 'FLAT_FEE', billingFrequency: 'MONTHLY',
            defaultRate: 500, isActive: true,
            metadata: { icon: 'wifi', description: 'Unlimited fiber internet', speed_mbps: 50 },
        },
    })

    const addonElec = await prisma.unitAddonCatalog.create({
        data: {
            name: 'Electricity (Metered)', category: 'utility',
            billingType: 'METERED', unitOfMeasure: 'kWh',
            defaultRate: 12.00, isActive: true,
            metadata: { icon: 'bolt', description: 'Based on actual meter reading' },
        },
    })

    await prisma.unitAddonCatalog.create({
        data: {
            name: 'Water (Metered)', category: 'utility',
            billingType: 'METERED', unitOfMeasure: 'cubic_meter',
            defaultRate: 30.00, isActive: true,
            metadata: { icon: 'droplet', description: 'Based on actual meter reading' },
        },
    })

    await prisma.unitAddonCatalog.create({
        data: {
            name: 'Parking Slot', category: 'parking',
            billingType: 'FLAT_FEE', billingFrequency: 'MONTHLY',
            defaultRate: 1500, isActive: true,
            metadata: { icon: 'car', description: 'One covered parking slot' },
        },
    })

    await prisma.unitAddonCatalog.create({
        data: {
            name: 'Laundry Access', category: 'laundry',
            billingType: 'FLAT_FEE', billingFrequency: 'MONTHLY',
            defaultRate: 300, isActive: true,
            metadata: { icon: 'washing-machine', description: 'Shared laundry area access' },
        },
    })

    console.log('   ✓ 5 addon catalog entries\n')

    // ── 11. Tenants ────────────────────────────────────────────────────────────
    console.log('🧑  Creating tenants...')

    const tenant1 = await prisma.tenant.create({
        data: {
            userId: tenantUser1.id,
            firstName: 'Ana', lastName: 'Garcia',
            phone: '09201234567', email: 'tenant1@renthub.com',
            emergencyContact: { name: 'Roberto Garcia', phone: '09209999999', relation: 'Father' },
        },
    })

    const tenant2 = await prisma.tenant.create({
        data: {
            userId: tenantUser2.id,
            firstName: 'Jose', lastName: 'Mendoza',
            phone: '09211234567', email: 'tenant2@renthub.com',
            emergencyContact: { name: 'Lita Mendoza', phone: '09219999999', relation: 'Mother' },
        },
    })

    // No portal account yet
    const tenant3 = await prisma.tenant.create({
        data: {
            userId: null,
            firstName: 'Carla', lastName: 'Bautista',
            phone: '09221234567', email: 'carla.bautista@email.com',
            internalNotes: 'Paid 3 months advance. No late payments.',
            emergencyContact: { name: 'Danny Bautista', phone: '09229999999', relation: 'Brother' },
        },
    })

    // Moved-out tenant (historical data)
    await prisma.tenant.create({
        data: {
            userId: null,
            firstName: 'Ramon', lastName: 'Torres',
            phone: '09231234567', email: 'ramon.torres@email.com',
            status: 'MOVED_OUT',
            internalNotes: 'Left unit in good condition. Full deposit refunded.',
        },
    })

    // Santos boarding house tenant
    const tenant5 = await prisma.tenant.create({
        data: {
            userId: null,
            firstName: 'Lorna', lastName: 'Villanueva',
            phone: '09241234567', email: 'lorna.v@email.com',
            emergencyContact: { name: 'Mario Villanueva', phone: '09249999999', relation: 'Husband' },
        },
    })

    console.log('   ✓ 5 tenants\n')

    // ── 12. Leases ─────────────────────────────────────────────────────────────
    console.log('📋  Creating leases...')

    const lease1 = await prisma.lease.create({
        data: {
            propertyGroupId: pg1.id, propertyId: prop1.id,
            tenantId: tenant1.id, unitId: unit1.id,
            leaseType: 'MONTHLY', billingDay: 5, advanceMonths: 1, gracePeriodDays: 3,
            moveInDate: new Date('2025-09-01'), rentAmount: 3500, securityDeposit: 3500,
            status: 'ACTIVE',
        },
    })

    const lease2 = await prisma.lease.create({
        data: {
            propertyGroupId: pg1.id, propertyId: prop1.id,
            tenantId: tenant2.id, unitId: unit2.id,
            leaseType: 'MONTHLY', billingDay: 5, advanceMonths: 1, gracePeriodDays: 3,
            moveInDate: new Date('2025-11-01'), rentAmount: 3500, securityDeposit: 3500,
            status: 'ACTIVE',
        },
    })

    const lease3 = await prisma.lease.create({
        data: {
            propertyGroupId: pg1.id, propertyId: prop1.id,
            tenantId: tenant3.id, unitId: unit6.id,
            leaseType: 'MONTHLY', billingDay: 5, advanceMonths: 1, gracePeriodDays: 5,
            moveInDate: new Date('2026-01-01'), rentAmount: 1800, securityDeposit: 1800,
            status: 'ACTIVE',
        },
    })

    const lease4 = await prisma.lease.create({
        data: {
            propertyGroupId: pg1.id, propertyId: prop2.id,
            tenantId: tenant1.id, unitId: unit7.id, // re-used tenant1 with a different unit for demo
            leaseType: 'MONTHLY', billingDay: 1, advanceMonths: 2, gracePeriodDays: 3,
            moveInDate: new Date('2025-10-01'), rentAmount: 8500, securityDeposit: 8500,
            status: 'ACTIVE',
        },
    })

    const lease5 = await prisma.lease.create({
        data: {
            propertyGroupId: pg2.id, propertyId: prop3.id,
            tenantId: tenant5.id, unitId: unit9.id,
            leaseType: 'MONTHLY', billingDay: 10, advanceMonths: 1, gracePeriodDays: 3,
            moveInDate: new Date('2026-01-10'), rentAmount: 3000, securityDeposit: 3000,
            status: 'ACTIVE',
        },
    })

    console.log('   ✓ 5 leases\n')

    // ── 13. Payments ───────────────────────────────────────────────────────────
    console.log('💰  Creating payments...')

    // lease1 — Ana Garcia / Room 101 — 5 months of history
    await prisma.payment.createMany({
        data: [
            { // Sep 2025 — PAID
                leaseId: lease1.id, propertyGroupId: pg1.id,
                periodStart: new Date('2025-09-01'), periodEnd: new Date('2025-09-30'),
                dueDate: new Date('2025-09-05'), amountDue: 3500, amountPaid: 3500,
                status: 'PAID', paymentMethod: 'CASH', datePaid: new Date('2025-09-04'),
            },
            { // Oct 2025 — PAID
                leaseId: lease1.id, propertyGroupId: pg1.id,
                periodStart: new Date('2025-10-01'), periodEnd: new Date('2025-10-31'),
                dueDate: new Date('2025-10-05'), amountDue: 3500, amountPaid: 3500,
                status: 'PAID', paymentMethod: 'GCASH', datePaid: new Date('2025-10-05'),
            },
            { // Nov 2025 — PAID
                leaseId: lease1.id, propertyGroupId: pg1.id,
                periodStart: new Date('2025-11-01'), periodEnd: new Date('2025-11-30'),
                dueDate: new Date('2025-11-05'), amountDue: 3500, amountPaid: 3500,
                status: 'PAID', paymentMethod: 'CASH', datePaid: new Date('2025-11-05'),
            },
            { // Dec 2025 — PAID
                leaseId: lease1.id, propertyGroupId: pg1.id,
                periodStart: new Date('2025-12-01'), periodEnd: new Date('2025-12-31'),
                dueDate: new Date('2025-12-05'), amountDue: 3500, amountPaid: 3500,
                status: 'PAID', paymentMethod: 'CASH', datePaid: new Date('2025-12-03'),
            },
            { // Jan 2026 — PAID
                leaseId: lease1.id, propertyGroupId: pg1.id,
                periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31'),
                dueDate: new Date('2026-01-05'), amountDue: 3500, amountPaid: 3500,
                status: 'PAID', paymentMethod: 'BANK_TRANSFER', datePaid: new Date('2026-01-05'),
            },
            { // Feb 2026 — UNPAID (current month, due soon)
                leaseId: lease1.id, propertyGroupId: pg1.id,
                periodStart: new Date('2026-02-01'), periodEnd: new Date('2026-02-28'),
                dueDate: new Date('2026-02-05'), amountDue: 3500, amountPaid: 0,
                status: 'OVERDUE', // past due date (today is Feb 21)
            },
        ],
    })

    // lease2 — Jose Mendoza / Room 102 — 3 months of history
    await prisma.payment.createMany({
        data: [
            { // Nov 2025 — PAID
                leaseId: lease2.id, propertyGroupId: pg1.id,
                periodStart: new Date('2025-11-01'), periodEnd: new Date('2025-11-30'),
                dueDate: new Date('2025-11-05'), amountDue: 3500, amountPaid: 3500,
                status: 'PAID', paymentMethod: 'CASH', datePaid: new Date('2025-11-04'),
            },
            { // Dec 2025 — PAID
                leaseId: lease2.id, propertyGroupId: pg1.id,
                periodStart: new Date('2025-12-01'), periodEnd: new Date('2025-12-31'),
                dueDate: new Date('2025-12-05'), amountDue: 3500, amountPaid: 3500,
                status: 'PAID', paymentMethod: 'CASH', datePaid: new Date('2025-12-06'),
            },
            { // Jan 2026 — PARTIAL
                leaseId: lease2.id, propertyGroupId: pg1.id,
                periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31'),
                dueDate: new Date('2026-01-05'), amountDue: 3500, amountPaid: 2000,
                status: 'PARTIAL', paymentMethod: 'CASH', datePaid: new Date('2026-01-08'),
            },
            { // Feb 2026 — OVERDUE
                leaseId: lease2.id, propertyGroupId: pg1.id,
                periodStart: new Date('2026-02-01'), periodEnd: new Date('2026-02-28'),
                dueDate: new Date('2026-02-05'), amountDue: 3500, amountPaid: 0,
                status: 'OVERDUE',
            },
        ],
    })

    // lease3 — Carla Bautista / Dorm A
    await prisma.payment.createMany({
        data: [
            { // Jan 2026 — PAID (advance)
                leaseId: lease3.id, propertyGroupId: pg1.id,
                periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31'),
                dueDate: new Date('2026-01-01'), amountDue: 1800, amountPaid: 1800,
                status: 'PAID', paymentMethod: 'CASH', datePaid: new Date('2026-01-01'),
            },
            { // Feb 2026 — UNPAID
                leaseId: lease3.id, propertyGroupId: pg1.id,
                periodStart: new Date('2026-02-01'), periodEnd: new Date('2026-02-28'),
                dueDate: new Date('2026-02-05'), amountDue: 1800, amountPaid: 0,
                status: 'UNPAID',
            },
        ],
    })

    // lease5 — Lorna Villanueva / Santos prop
    await prisma.payment.createMany({
        data: [
            { // Jan 2026 advance — PAID
                leaseId: lease5.id, propertyGroupId: pg2.id,
                periodStart: new Date('2026-01-10'), periodEnd: new Date('2026-01-31'),
                dueDate: new Date('2026-01-10'), amountDue: 3000, amountPaid: 3000,
                status: 'PAID', paymentMethod: 'GCASH', datePaid: new Date('2026-01-10'),
            },
            { // Feb 2026 — UNPAID
                leaseId: lease5.id, propertyGroupId: pg2.id,
                periodStart: new Date('2026-02-01'), periodEnd: new Date('2026-02-28'),
                dueDate: new Date('2026-02-10'), amountDue: 3000, amountPaid: 0,
                status: 'UNPAID',
            },
        ],
    })

    console.log('   ✓ Payments created\n')

    // ── 14. Unit Addons ────────────────────────────────────────────────────────
    console.log('🔌  Assigning unit addons...')

    // Room 101 — WiFi and Electricity
    await prisma.unitAddon.create({
        data: {
            unitId: unit1.id, addonCatalogId: addonWifi.id, propertyGroupId: pg1.id,
            rate: 500, isIncluded: false, effectiveFrom: new Date('2025-09-01'),
            notes: 'WiFi pw: dcpension2025',
        },
    })

    await prisma.unitAddon.create({
        data: {
            unitId: unit1.id, addonCatalogId: addonElec.id, propertyGroupId: pg1.id,
            rate: 12.00, isIncluded: false, meterNumber: 'MTR-101-E',
            effectiveFrom: new Date('2025-09-01'),
        },
    })

    // Room 102 — WiFi
    await prisma.unitAddon.create({
        data: {
            unitId: unit2.id, addonCatalogId: addonWifi.id, propertyGroupId: pg1.id,
            rate: 500, isIncluded: false, effectiveFrom: new Date('2025-11-01'),
        },
    })

    console.log('   ✓ Unit addons assigned\n')

    // ── Done ───────────────────────────────────────────────────────────────────
    console.log('✅  Seeding complete!\n')
    console.log('─────────────────────────────────────')
    console.log('  Test Accounts (password: password)')
    console.log('─────────────────────────────────────')
    console.log('  SYSTEM_ADMIN  admin@renthub.com')
    console.log('  LANDLORD      landlord1@renthub.com')
    console.log('  LANDLORD      landlord2@renthub.com')
    console.log('  STAFF         staff@renthub.com')
    console.log('  TENANT        tenant1@renthub.com')
    console.log('  TENANT        tenant2@renthub.com')
    console.log('─────────────────────────────────────\n')
}

main()
    .catch((e) => {
        console.error('❌  Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
