'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useUnit } from '@/features/landlord/hooks/useUnits';
import { Home, User } from 'lucide-react';
import { formatPeso } from '@/lib/utils';

export default function UnitDetailPage({
  params,
}: {
  params: Promise<{ pgId: string; unitId: string }>;
}) {
  const { pgId, unitId } = use(params);
  const router = useRouter();
  const { data: unit, isLoading } = useUnit(pgId, unitId);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Unit Details" />
        <div className="mt-6 h-48 animate-pulse rounded-lg bg-slate-100" />
      </>
    );
  }

  if (!unit) {
    return (
      <>
        <PageHeader title="Unit Not Found" />
        <Card className="mt-6 max-w-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">The unit record could not be loaded.</p>
            <Button className="mt-4" onClick={() => router.push(`/${pgId}/properties`)}>
              Back to Properties
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const activeLease = unit.leases?.find((lease) => lease.status === 'ACTIVE');

  return (
    <>
      <PageHeader
        title={unit.unitName}
        description={unit.property?.propertyName ?? 'Unit details'}
        action={
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                unit.property?.id
                  ? `/${pgId}/properties/${unit.property.id}`
                  : `/${pgId}/properties`
              )
            }
          >
            Back
          </Button>
        }
      />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Unit Information</CardTitle>
              <StatusBadge status={unit.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Property</p>
                <p className="mt-1 font-medium text-slate-900">{unit.property?.propertyName ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Unit Type</p>
                <p className="mt-1 font-medium text-slate-900">{unit.unitType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Monthly Rent</p>
                <p className="mt-1 font-medium text-slate-900">{formatPeso(unit.monthlyRent)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Floor Number</p>
                <p className="mt-1 font-medium text-slate-900">{unit.floorNumber ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Max Occupants</p>
                <p className="mt-1 font-medium text-slate-900">{unit.maxOccupants ?? 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            {activeLease ? (
              <div className="space-y-2">
                <div className="flex items-center text-slate-900">
                  <User className="mr-2 h-4 w-4 text-slate-400" />
                  {activeLease.tenant.firstName} {activeLease.tenant.lastName}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/${pgId}/leases/${activeLease.id}`)}
                >
                  View Active Lease
                </Button>
              </div>
            ) : (
              <div className="flex items-center text-slate-600">
                <Home className="mr-2 h-4 w-4 text-slate-400" />
                No active lease for this unit.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
