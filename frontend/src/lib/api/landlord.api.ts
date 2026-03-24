import { apiClient } from "./client";
import type {
  Property,
  Unit,
  Tenant,
  Lease,
  Payment,
  OverviewStats,
  PropertyGroupSubscription,
  CreatePropertyDto,
  CreateUnitDto,
  CreateTenantDto,
  CreateLeaseDto,
  RecordPaymentDto,
} from "@/types/domain.types";

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function unwrapList<T>(payload: T[] | { data: T[] }): T[] {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

export async function getOverviewStats(pgId: string): Promise<OverviewStats> {
  const { data } = await apiClient.get(
    `/property-groups/${pgId}/stats/overview`,
  );
  return unwrap<OverviewStats>(data);
}

export async function getSubscription(
  pgId: string,
): Promise<PropertyGroupSubscription> {
  const { data } = await apiClient.get(`/property-groups/${pgId}/subscription`);
  return unwrap<PropertyGroupSubscription>(data);
}

export async function getProperties(pgId: string): Promise<Property[]> {
  const { data } = await apiClient.get(`/property-groups/${pgId}/properties`);
  return unwrapList<Property>(data);
}

export async function getProperty(
  pgId: string,
  propertyId: string,
): Promise<Property> {
  const { data } = await apiClient.get(
    `/property-groups/${pgId}/properties/${propertyId}`,
  );
  return unwrap<Property>(data);
}

export async function createProperty(
  pgId: string,
  dto: CreatePropertyDto,
): Promise<Property> {
  const { data } = await apiClient.post(
    `/property-groups/${pgId}/properties`,
    dto,
  );
  return unwrap<Property>(data);
}

export async function updateProperty(
  pgId: string,
  propertyId: string,
  dto: Partial<CreatePropertyDto>,
): Promise<Property> {
  const { data } = await apiClient.patch(
    `/property-groups/${pgId}/properties/${propertyId}`,
    dto,
  );
  return unwrap<Property>(data);
}

export async function deleteProperty(
  pgId: string,
  propertyId: string,
): Promise<void> {
  await apiClient.delete(`/property-groups/${pgId}/properties/${propertyId}`);
}

export async function getUnits(
  pgId: string,
  propertyId?: string,
): Promise<Unit[]> {
  const url = propertyId
    ? `/properties/${propertyId}/units`
    : `/property-groups/${pgId}/units`;
  const { data } = await apiClient.get(url);
  return unwrapList<Unit>(data);
}

export async function getUnit(pgId: string, unitId: string): Promise<Unit> {
  const { data } = await apiClient.get(`/units/${unitId}`);
  return unwrap<Unit>(data);
}

export async function createUnit(
  pgId: string,
  propertyId: string,
  dto: CreateUnitDto,
): Promise<Unit> {
  const { data } = await apiClient.post(`/properties/${propertyId}/units`, dto);
  return unwrap<Unit>(data);
}

export async function updateUnit(
  pgId: string,
  unitId: string,
  dto: Partial<CreateUnitDto>,
): Promise<Unit> {
  const { data } = await apiClient.patch(`/units/${unitId}`, dto);
  return unwrap<Unit>(data);
}

export async function deleteUnit(pgId: string, unitId: string): Promise<void> {
  await apiClient.delete(`/units/${unitId}`);
}

export async function getTenants(pgId: string): Promise<Tenant[]> {
  const { data } = await apiClient.get(`/property-groups/${pgId}/tenants`);
  return unwrapList<Tenant>(data);
}

export async function getTenant(
  pgId: string,
  tenantId: string,
): Promise<Tenant> {
  const { data } = await apiClient.get(
    `/property-groups/${pgId}/tenants/${tenantId}`,
  );
  return unwrap<Tenant>(data);
}

export async function createTenant(
  pgId: string,
  dto: CreateTenantDto,
): Promise<Tenant> {
  const { data } = await apiClient.post(
    `/property-groups/${pgId}/tenants`,
    dto,
  );
  return unwrap<Tenant>(data);
}

export async function updateTenant(
  pgId: string,
  tenantId: string,
  dto: Partial<CreateTenantDto>,
): Promise<Tenant> {
  const { data } = await apiClient.patch(
    `/property-groups/${pgId}/tenants/${tenantId}`,
    dto,
  );
  return unwrap<Tenant>(data);
}

export async function deleteTenant(
  pgId: string,
  tenantId: string,
): Promise<void> {
  await apiClient.delete(`/property-groups/${pgId}/tenants/${tenantId}`);
}

export async function getLeases(pgId: string): Promise<Lease[]> {
  const { data } = await apiClient.get(`/property-groups/${pgId}/leases`);
  return unwrapList<Lease>(data);
}

export async function getLease(pgId: string, leaseId: string): Promise<Lease> {
  const { data } = await apiClient.get(`/leases/${leaseId}`);
  return unwrap<Lease>(data);
}

export async function createLease(
  pgId: string,
  dto: CreateLeaseDto,
): Promise<Lease> {
  const { data } = await apiClient.post(`/property-groups/${pgId}/leases`, dto);
  return unwrap<Lease>(data);
}

export async function updateLease(
  pgId: string,
  leaseId: string,
  dto: Partial<CreateLeaseDto>,
): Promise<Lease> {
  const { data } = await apiClient.patch(`/leases/${leaseId}`, dto);
  return unwrap<Lease>(data);
}

export async function deleteLease(
  pgId: string,
  leaseId: string,
): Promise<void> {
  await apiClient.post(`/leases/${leaseId}/close`, {
    moveOutDate: new Date().toISOString().slice(0, 10),
  });
}

export async function getPayments(pgId: string): Promise<Payment[]> {
  const { data } = await apiClient.get(`/property-groups/${pgId}/payments`);
  return unwrapList<Payment>(data);
}

export async function getPayment(
  pgId: string,
  paymentId: string,
): Promise<Payment> {
  const { data } = await apiClient.get(`/payments/${paymentId}`);
  return unwrap<Payment>(data);
}

export async function recordPayment(
  pgId: string,
  paymentId: string,
  dto: RecordPaymentDto,
): Promise<Payment> {
  const { data } = await apiClient.patch(`/payments/${paymentId}/manual`, dto);
  return unwrap<Payment>(data);
}

export const landlordApi = {
  getOverviewStats,
  getSubscription,
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getLeases,
  getLease,
  createLease,
  updateLease,
  deleteLease,
  getPayments,
  getPayment,
  recordPayment,
};
