'use client';

import { use } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useProperty } from '@/features/landlord/hooks/useProperties';
import { useUnits } from '@/features/landlord/hooks/useUnits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPeso } from '@/lib/utils';

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ pgId: string; propertyId: string }>;
}) {
  const { pgId, propertyId } = use(params);
  const { data: property, isLoading: propertyLoading } = useProperty(pgId, propertyId);
  const { data: units, isLoading: unitsLoading } = useUnits(pgId, propertyId);
  const router = useRouter();

  if (propertyLoading) {
    return (
      <>
        <PageHeader title="Property Details" />
        <div className="mt-6 space-y-6">
          <div className="h-48 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
        </div>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <PageHeader title="Property Not Found" />
        <div className="mt-6 text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">Property not found.</p>
          <Button onClick={() => router.push(`/${pgId}/properties`)} className="mt-4">
            Back to Properties
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={property.propertyName}
        description="Property details and units"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/${pgId}/properties`)}>
              Back
            </Button>
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Property Type</label>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {property.propertyType.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Total Units</label>
                <p className="mt-1 text-slate-900">{units?.length ?? 0}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600">Address</label>
                <div className="mt-1 flex items-start text-slate-900">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400" />
                  <span>
                    {property.addressLine}, {property.city}
                    {property.province && `, ${property.province}`}
                    {property.postalCode && ` ${property.postalCode}`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Units</CardTitle>
              <Button
                size="sm"
                onClick={() => router.push(`/${pgId}/properties/${propertyId}/units/new`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {unitsLoading ? (
              <div className="h-32 bg-slate-100 animate-pulse rounded" />
            ) : units && units.length === 0 ? (
              <div className="text-center py-8">
                <Home className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No units yet. Add your first unit.</p>
                <Button
                  size="sm"
                  onClick={() => router.push(`/${pgId}/properties/${propertyId}/units/new`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {units?.map((unit) => (
                  <div
                    key={unit.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/${pgId}/units/${unit.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{unit.unitName}</h4>
                      <Badge
                        variant={
                          unit.status === 'AVAILABLE'
                            ? 'success'
                            : unit.status === 'OCCUPIED'
                            ? 'secondary'
                            : 'warning'
                        }
                      >
                        {unit.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {unit.unitType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatPeso(unit.monthlyRent)}/mo
                    </p>
                    {unit.maxOccupants && (
                      <p className="text-xs text-slate-500 mt-2">
                        Max {unit.maxOccupants} occupant{unit.maxOccupants > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
