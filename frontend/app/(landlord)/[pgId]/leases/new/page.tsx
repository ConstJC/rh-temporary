'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { useTenants } from '@/features/landlord/hooks/useTenants';
import { useUnits } from '@/features/landlord/hooks/useUnits';
import { useCreateLease } from '@/features/landlord/hooks/useLeases';
import { EmptyState } from '@/components/common/EmptyState';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { LeaseType } from '@/types/domain.types';

const leaseTypeOptions: Array<{ value: LeaseType; label: string }> = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'FIXED', label: 'Fixed' },
];

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unable to create lease. Please try again.';
}

export default function NewLeasePage() {
  const { pgId } = usePropertyGroup();
  const router = useRouter();

  const { data: tenants, isLoading: tenantsLoading } = useTenants(pgId);
  const { data: units, isLoading: unitsLoading } = useUnits(pgId);
  const createLease = useCreateLease(pgId);

  const availableUnits = useMemo(
    () => (units ?? []).filter((unit) => unit.status === 'AVAILABLE'),
    [units]
  );

  const [tenantId, setTenantId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [leaseType, setLeaseType] = useState<LeaseType>('MONTHLY');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().slice(0, 10));
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [billingDay, setBillingDay] = useState('1');
  const [advanceMonths, setAdvanceMonths] = useState('1');
  const [gracePeriodDays, setGracePeriodDays] = useState('3');

  const selectedTenantId = tenantId || tenants?.[0]?.id || '';
  const selectedUnitId = unitId || availableUnits[0]?.id || '';
  const selectedUnit = availableUnits.find((item) => item.id === selectedUnitId);
  const resolvedRentAmount = rentAmount || (selectedUnit ? String(selectedUnit.monthlyRent) : '');
  const resolvedSecurityDeposit =
    securityDeposit || (selectedUnit ? String(selectedUnit.monthlyRent) : '');

  function onUnitChange(nextUnitId: string) {
    setUnitId(nextUnitId);
    const unit = availableUnits.find((item) => item.id === nextUnitId);
    if (!unit) return;
    setRentAmount(String(unit.monthlyRent));
    setSecurityDeposit(String(unit.monthlyRent));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rentAmountValue = Number(resolvedRentAmount);
    const securityDepositValue = Number(resolvedSecurityDeposit);
    const billingDayValue = Number(billingDay);
    const advanceMonthsValue = Number(advanceMonths);
    const gracePeriodDaysValue = Number(gracePeriodDays);

    if (!selectedTenantId || !selectedUnitId) {
      toast.error('Tenant and unit are required.');
      return;
    }
    if (!Number.isFinite(rentAmountValue) || rentAmountValue < 0) {
      toast.error('Rent amount must be a valid non-negative amount.');
      return;
    }
    if (!Number.isFinite(securityDepositValue) || securityDepositValue < 0) {
      toast.error('Security deposit must be a valid non-negative amount.');
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
      toast.success('Lease created');
      router.push(`/${pgId}/leases/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (tenantsLoading || unitsLoading) {
    return (
      <>
        <PageHeader title="Create Lease" description="Link a tenant to an available unit" />
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-slate-100" />
      </>
    );
  }

  if (!tenants?.length || !availableUnits.length) {
    return (
      <>
        <PageHeader
          title="Create Lease"
          description="Link a tenant to an available unit"
          action={
            <Button variant="outline" onClick={() => router.push(`/${pgId}/leases`)}>
              Back to Leases
            </Button>
          }
        />

        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Lease setup needs more data"
          description={
            !tenants?.length
              ? 'Create at least one tenant before creating a lease.'
              : 'No available units found. Add a new unit or mark one as available.'
          }
          action={
            <Button
              onClick={() =>
                router.push(!tenants?.length ? `/${pgId}/tenants/new` : `/${pgId}/properties`)
              }
            >
              {!tenants?.length ? 'Add Tenant' : 'Manage Properties'}
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
          <Button variant="outline" onClick={() => router.push(`/${pgId}/leases`)}>
            Cancel
          </Button>
        }
      />

      <Card className="mt-6 max-w-4xl">
        <CardHeader>
          <CardTitle className="text-lg">Lease Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="tenantId" className="text-sm font-medium text-slate-700">
                  Tenant
                </label>
                <select
                  id="tenantId"
                  value={selectedTenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.firstName} {tenant.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="unitId" className="text-sm font-medium text-slate-700">
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
                      {unit.property?.propertyName ? `${unit.property.propertyName} - ` : ''}
                      {unit.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="leaseType" className="text-sm font-medium text-slate-700">
                  Lease Type
                </label>
                <select
                  id="leaseType"
                  value={leaseType}
                  onChange={(event) => setLeaseType(event.target.value as LeaseType)}
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
                <label htmlFor="moveInDate" className="text-sm font-medium text-slate-700">
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
                <label htmlFor="rentAmount" className="text-sm font-medium text-slate-700">
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
                <label htmlFor="securityDeposit" className="text-sm font-medium text-slate-700">
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
                <label htmlFor="billingDay" className="text-sm font-medium text-slate-700">
                  Billing Day (1-28)
                </label>
                <Input
                  id="billingDay"
                  type="number"
                  min={1}
                  max={28}
                  value={billingDay}
                  onChange={(event) => setBillingDay(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="advanceMonths" className="text-sm font-medium text-slate-700">
                  Advance Months
                </label>
                <Input
                  id="advanceMonths"
                  type="number"
                  min={0}
                  value={advanceMonths}
                  onChange={(event) => setAdvanceMonths(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="gracePeriodDays" className="text-sm font-medium text-slate-700">
                  Grace Period (days)
                </label>
                <Input
                  id="gracePeriodDays"
                  type="number"
                  min={0}
                  value={gracePeriodDays}
                  onChange={(event) => setGracePeriodDays(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/${pgId}/leases`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLease.isPending}>
                {createLease.isPending ? 'Saving...' : 'Create Lease'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
