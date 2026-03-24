export const landlordKeys = {
  all: () => ["landlord"] as const,

  // Overview stats
  overview: (pgId: string) => ["landlord", "overview", pgId] as const,
  subscription: (pgId: string) => ["landlord", "subscription", pgId] as const,

  // Properties
  properties: (pgId: string) => ["landlord", "properties", pgId] as const,
  property: (pgId: string, propertyId: string) =>
    ["landlord", "properties", pgId, propertyId] as const,

  // Units
  units: (pgId: string, propertyId?: string) =>
    ["landlord", "units", pgId, propertyId || "all"] as const,
  unit: (pgId: string, unitId: string) =>
    ["landlord", "units", pgId, unitId] as const,

  // Tenants
  tenants: (pgId: string) => ["landlord", "tenants", pgId] as const,
  tenant: (pgId: string, tenantId: string) =>
    ["landlord", "tenants", pgId, tenantId] as const,

  // Leases
  leases: (pgId: string) => ["landlord", "leases", pgId] as const,
  lease: (pgId: string, leaseId: string) =>
    ["landlord", "leases", pgId, leaseId] as const,

  // Payments
  payments: (pgId: string) => ["landlord", "payments", pgId] as const,
  payment: (pgId: string, paymentId: string) =>
    ["landlord", "payments", pgId, paymentId] as const,
} as const;
