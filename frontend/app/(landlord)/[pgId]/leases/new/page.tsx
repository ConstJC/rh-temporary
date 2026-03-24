"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePropertyGroup } from "@/hooks/usePropertyGroup";
import {
  useCreateTenant,
  useTenants,
} from "@/features/landlord/hooks/useTenants";
import { useUnits } from "@/features/landlord/hooks/useUnits";
import { useCreateLease } from "@/features/landlord/hooks/useLeases";
import { EmptyState } from "@/components/common/EmptyState";
import { FileText, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { LeaseType, Tenant } from "@/types/domain.types";
import { toFiniteNumber } from "@/lib/utils";

const leaseTypeOptions: Array<{ value: LeaseType; label: string }> = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "DAILY", label: "Daily" },
  { value: "FIXED", label: "Fixed" },
];

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unable to process request. Please try again.";
}

export default function NewLeasePage() {
  const { pgId } = usePropertyGroup();
  const router = useRouter();

  const { data: tenants, isLoading: tenantsLoading } = useTenants(pgId);
  const { data: units, isLoading: unitsLoading } = useUnits(pgId);
  const createTenant = useCreateTenant(pgId);
  const createLease = useCreateLease(pgId);

  const [createdTenants, setCreatedTenants] = useState<Tenant[]>([]);

  const availableUnits = useMemo(
    () => (units ?? []).filter((unit) => unit.status === "AVAILABLE"),
    [units],
  );

  const tenantOptions = useMemo(() => {
    const map = new Map<string, Tenant>();
    for (const tenant of tenants ?? []) {
      map.set(tenant.id, tenant);
    }
    for (const tenant of createdTenants) {
      map.set(tenant.id, tenant);
    }
    return Array.from(map.values());
  }, [tenants, createdTenants]);

  const eligibleTenants = useMemo(
    () =>
      tenantOptions.filter((tenant) => {
        if (tenant.status === "BLACKLISTED") return false;
        return !(tenant.leases ?? []).some(
          (lease) => lease.status === "ACTIVE",
        );
      }),
    [tenantOptions],
  );

  const [showQuickAddTenant, setShowQuickAddTenant] = useState(false);
  const [newTenantFirstName, setNewTenantFirstName] = useState("");
  const [newTenantLastName, setNewTenantLastName] = useState("");
  const [newTenantPhone, setNewTenantPhone] = useState("");
  const [newTenantEmail, setNewTenantEmail] = useState("");

  const [tenantId, setTenantId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [leaseType, setLeaseType] = useState<LeaseType>("MONTHLY");
  const [moveInDate, setMoveInDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [billingDay, setBillingDay] = useState("1");
  const [advanceMonths, setAdvanceMonths] = useState("1");
  const [gracePeriodDays, setGracePeriodDays] = useState("3");

  const selectedTenantId = eligibleTenants.some(
    (tenant) => tenant.id === tenantId,
  )
    ? tenantId
    : (eligibleTenants[0]?.id ?? "");
  const selectedUnitId = availableUnits.some((unit) => unit.id === unitId)
    ? unitId
    : (availableUnits[0]?.id ?? "");
  const selectedUnit = availableUnits.find(
    (item) => item.id === selectedUnitId,
  );
  const resolvedRentAmount =
    rentAmount ||
    (selectedUnit ? String(toFiniteNumber(selectedUnit.monthlyRent)) : "");
  const resolvedSecurityDeposit =
    securityDeposit ||
    (selectedUnit ? String(toFiniteNumber(selectedUnit.monthlyRent)) : "");

  function onUnitChange(nextUnitId: string) {
    setUnitId(nextUnitId);
    const unit = availableUnits.find((item) => item.id === nextUnitId);
    if (!unit) return;
    setRentAmount(String(toFiniteNumber(unit.monthlyRent)));
    setSecurityDeposit(String(toFiniteNumber(unit.monthlyRent)));
  }

  async function handleQuickAddTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const firstName = newTenantFirstName.trim();
    const lastName = newTenantLastName.trim();
    const phone = newTenantPhone.trim();
    const email = newTenantEmail.trim();

    if (!firstName || !lastName || !phone || !email) {
      toast.error("First name, last name, phone, and email are required.");
      return;
    }

    try {
      const created = await createTenant.mutateAsync({
        firstName,
        lastName,
        phone,
        email,
      });

      setCreatedTenants((prev) => {
        const map = new Map(prev.map((tenant) => [tenant.id, tenant] as const));
        map.set(created.id, created);
        return Array.from(map.values());
      });
      setTenantId(created.id);
      setShowQuickAddTenant(false);
      setNewTenantFirstName("");
      setNewTenantLastName("");
      setNewTenantPhone("");
      setNewTenantEmail("");
      toast.success(
        "Tenant created. Setup email has been prepared. Continue creating the lease.",
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rentAmountValue = Number(resolvedRentAmount);
    const securityDepositValue = Number(resolvedSecurityDeposit);
    const billingDayValue = Number(billingDay);
    const advanceMonthsValue = Number(advanceMonths);
    const gracePeriodDaysValue = Number(gracePeriodDays);

    if (!selectedTenantId || !selectedUnitId) {
      toast.error("Tenant and unit are required.");
      return;
    }
    if (!Number.isFinite(rentAmountValue) || rentAmountValue < 0) {
      toast.error("Rent amount must be a valid non-negative amount.");
      return;
    }
    if (!Number.isFinite(securityDepositValue) || securityDepositValue < 0) {
      toast.error("Security deposit must be a valid non-negative amount.");
      return;
    }
    if (
      !Number.isInteger(billingDayValue) ||
      billingDayValue < 1 ||
      billingDayValue > 28
    ) {
      toast.error("Billing day must be an integer between 1 and 28.");
      return;
    }
    if (!Number.isInteger(advanceMonthsValue) || advanceMonthsValue < 0) {
      toast.error("Advance months must be a whole number that is 0 or higher.");
      return;
    }
    if (!Number.isInteger(gracePeriodDaysValue) || gracePeriodDaysValue < 0) {
      toast.error("Grace period must be a whole number that is 0 or higher.");
      return;
    }

    try {
      const created = await createLease.mutateAsync({
        tenantId: selectedTenantId,
        unitId: selectedUnitId,
        leaseType,
        moveInDate,
        rentAmount: rentAmountValue,
        securityDeposit: securityDepositValue,
        billingDay: billingDayValue,
        advanceMonths: advanceMonthsValue,
        gracePeriodDays: gracePeriodDaysValue,
      });
      toast.success("Lease created");
      router.push(`/${pgId}/leases/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (tenantsLoading || unitsLoading) {
    return (
      <>
        <PageHeader
          title="Create Lease"
          description="Link a tenant to an available unit"
        />
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-slate-100" />
      </>
    );
  }

  if (!availableUnits.length) {
    return (
      <>
        <PageHeader
          title="Create Lease"
          description="Link a tenant to an available unit"
          action={
            <Button
              variant="outline"
              onClick={() => router.push(`/${pgId}/leases`)}
            >
              Back to Tenant Leases
            </Button>
          }
        />

        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Lease setup needs more data"
          description="No available units found. Add a new unit or mark one as available."
          action={
            <Button onClick={() => router.push(`/${pgId}/properties`)}>
              Manage Properties
            </Button>
          }
          className="mt-6"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Create Lease"
        description="Link a tenant to an available unit"
        action={
          <Button
            variant="outline"
            onClick={() => router.push(`/${pgId}/leases`)}
          >
            Back to Tenant Leases
          </Button>
        }
      />

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <CardTitle className="text-lg">Tenant Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-700">
              {eligibleTenants.length
                ? "Need to add another tenant before creating this lease?"
                : "No eligible tenants available yet. Add one below to continue."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickAddTenant((prev) => !prev)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {showQuickAddTenant ? "Close" : "Quick Add Tenant"}
            </Button>
          </div>

          {showQuickAddTenant && (
            <form
              className="space-y-4 rounded-md border border-slate-200 p-4"
              onSubmit={handleQuickAddTenant}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="newTenantFirstName"
                    className="text-sm font-medium text-slate-700"
                  >
                    First Name
                  </label>
                  <Input
                    id="newTenantFirstName"
                    value={newTenantFirstName}
                    onChange={(event) =>
                      setNewTenantFirstName(event.target.value)
                    }
                    placeholder="Maria"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="newTenantLastName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Last Name
                  </label>
                  <Input
                    id="newTenantLastName"
                    value={newTenantLastName}
                    onChange={(event) =>
                      setNewTenantLastName(event.target.value)
                    }
                    placeholder="Santos"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="newTenantPhone"
                    className="text-sm font-medium text-slate-700"
                  >
                    Phone
                  </label>
                  <Input
                    id="newTenantPhone"
                    value={newTenantPhone}
                    onChange={(event) => setNewTenantPhone(event.target.value)}
                    placeholder="09171234567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="newTenantEmail"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <Input
                    id="newTenantEmail"
                    type="email"
                    value={newTenantEmail}
                    onChange={(event) => setNewTenantEmail(event.target.value)}
                    placeholder="maria@example.com"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={createTenant.isPending}>
                  {createTenant.isPending ? "Saving..." : "Create Tenant"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <CardTitle className="text-lg">Lease Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="tenantId"
                  className="text-sm font-medium text-slate-700"
                >
                  Tenant
                </label>
                <select
                  id="tenantId"
                  value={selectedTenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  disabled={!eligibleTenants.length}
                  required
                >
                  {!eligibleTenants.length ? (
                    <option value="">No eligible tenants yet</option>
                  ) : (
                    eligibleTenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="unitId"
                  className="text-sm font-medium text-slate-700"
                >
                  Available Unit
                </label>
                <select
                  id="unitId"
                  value={selectedUnitId}
                  onChange={(event) => onUnitChange(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.property?.propertyName
                        ? `${unit.property.propertyName} - `
                        : ""}
                      {unit.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="leaseType"
                  className="text-sm font-medium text-slate-700"
                >
                  Lease Type
                </label>
                <select
                  id="leaseType"
                  value={leaseType}
                  onChange={(event) =>
                    setLeaseType(event.target.value as LeaseType)
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  {leaseTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="moveInDate"
                  className="text-sm font-medium text-slate-700"
                >
                  Move-in Date
                </label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={moveInDate}
                  onChange={(event) => setMoveInDate(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="rentAmount"
                  className="text-sm font-medium text-slate-700"
                >
                  Rent Amount
                </label>
                <Input
                  id="rentAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={resolvedRentAmount}
                  onChange={(event) => setRentAmount(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="securityDeposit"
                  className="text-sm font-medium text-slate-700"
                >
                  Security Deposit
                </label>
                <Input
                  id="securityDeposit"
                  type="number"
                  min={0}
                  step="0.01"
                  value={resolvedSecurityDeposit}
                  onChange={(event) => setSecurityDeposit(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="billingDay"
                  className="text-sm font-medium text-slate-700"
                >
                  Billing Day (1-28)
                </label>
                <Input
                  id="billingDay"
                  type="number"
                  min={1}
                  max={28}
                  step={1}
                  value={billingDay}
                  onChange={(event) => setBillingDay(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="advanceMonths"
                  className="text-sm font-medium text-slate-700"
                >
                  Advance Months
                </label>
                <Input
                  id="advanceMonths"
                  type="number"
                  min={0}
                  step={1}
                  value={advanceMonths}
                  onChange={(event) => setAdvanceMonths(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="gracePeriodDays"
                  className="text-sm font-medium text-slate-700"
                >
                  Grace Period (days)
                </label>
                <Input
                  id="gracePeriodDays"
                  type="number"
                  min={0}
                  step={1}
                  value={gracePeriodDays}
                  onChange={(event) => setGracePeriodDays(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${pgId}/leases`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLease.isPending || !eligibleTenants.length}
              >
                {createLease.isPending ? "Saving..." : "Create Lease"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
