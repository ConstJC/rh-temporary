'use client';

import { FormEvent, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateUnit } from '@/features/landlord/hooks/useUnits';
import { useProperty } from '@/features/landlord/hooks/useProperties';
import { toast } from 'sonner';
import type { UnitType } from '@/types/domain.types';

const unitTypeOptions: Array<{ value: UnitType; label: string }> = [
  { value: 'STUDIO', label: 'Studio' },
  { value: 'BEDROOM', label: 'Bedroom' },
  { value: 'ENTIRE_UNIT', label: 'Entire Unit' },
  { value: 'SHARED_ROOM', label: 'Shared Room' },
  { value: 'DORM', label: 'Dorm' },
  { value: 'OTHER', label: 'Other' },
];

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unable to create unit. Please try again.';
}

export default function NewUnitPage({
  params,
}: {
  params: Promise<{ pgId: string; propertyId: string }>;
}) {
  const { pgId, propertyId } = use(params);
  const router = useRouter();

  const { data: property } = useProperty(pgId, propertyId);
  const createUnit = useCreateUnit(pgId, propertyId);

  const [unitType, setUnitType] = useState<UnitType>('BEDROOM');
  const [unitName, setUnitName] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [maxOccupants, setMaxOccupants] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const monthlyRentValue = Number(monthlyRent);
    if (!Number.isFinite(monthlyRentValue) || monthlyRentValue < 0) {
      toast.error('Monthly rent must be a valid non-negative amount.');
      return;
    }

    try {
      const created = await createUnit.mutateAsync({
        unitType,
        unitName,
        monthlyRent: monthlyRentValue,
        floorNumber: floorNumber ? Number(floorNumber) : undefined,
        maxOccupants: maxOccupants ? Number(maxOccupants) : undefined,
      });
      toast.success('Unit created');
      router.push(`/${pgId}/units/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Add Unit"
        description={property ? `Create a unit for ${property.propertyName}` : 'Create a unit'}
        action={
          <Button
            variant="outline"
            onClick={() => router.push(`/${pgId}/properties/${propertyId}`)}
          >
            Cancel
          </Button>
        }
      />

      <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Unit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="unitType">
                  Unit Type
                </label>
                <select
                  id="unitType"
                  value={unitType}
                  onChange={(event) => setUnitType(event.target.value as UnitType)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  {unitTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="unitName">
                  Unit Name / Number
                </label>
                <Input
                  id="unitName"
                  value={unitName}
                  onChange={(event) => setUnitName(event.target.value)}
                  placeholder="Room 101"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="monthlyRent">
                  Monthly Rent
                </label>
                <Input
                  id="monthlyRent"
                  type="number"
                  min={0}
                  step="0.01"
                  value={monthlyRent}
                  onChange={(event) => setMonthlyRent(event.target.value)}
                  placeholder="5000"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="floorNumber">
                  Floor Number (Optional)
                </label>
                <Input
                  id="floorNumber"
                  type="number"
                  value={floorNumber}
                  onChange={(event) => setFloorNumber(event.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="maxOccupants">
                  Maximum Occupants (Optional)
                </label>
                <Input
                  id="maxOccupants"
                  type="number"
                  min={1}
                  value={maxOccupants}
                  onChange={(event) => setMaxOccupants(event.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${pgId}/properties/${propertyId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUnit.isPending}>
                {createUnit.isPending ? 'Saving...' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
