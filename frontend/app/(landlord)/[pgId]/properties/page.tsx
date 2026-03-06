'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { useProperties } from '@/features/landlord/hooks/useProperties';
import { useSubscription } from '@/features/landlord/hooks/useOverviewStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Building2, MapPin, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SlideOver } from '@/components/common/SlideOver';
import { AddPropertyForm } from '@/features/landlord/components/AddPropertyForm';
import { toFiniteNumber } from '@/lib/utils';

export default function PropertiesPage() {
  const { pgId } = usePropertyGroup();
  const { data: properties, isLoading } = useProperties(pgId);
  const { data: subscription } = useSubscription(pgId);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentProperties = toFiniteNumber(subscription?.usage.properties ?? properties?.length ?? 0);
  const propertyLimit = toFiniteNumber(subscription?.plan.propertyLimit);
  const remainingProperties =
    propertyLimit === 0 ? null : Math.max(0, propertyLimit - currentProperties);

  const usedUnits = toFiniteNumber(subscription?.usage.units);
  const unitLimit = toFiniteNumber(subscription?.plan.unitLimit);
  const remainingOrgUnitSlots = unitLimit === 0 ? null : Math.max(0, unitLimit - usedUnits);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Properties" description="Manage your properties and units" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Properties"
        description={
          remainingProperties === null
            ? 'Manage your properties and units. Your plan allows unlimited properties.'
            : `Manage your properties and units. You can add ${remainingProperties} more propert${remainingProperties === 1 ? 'y' : 'ies'}.`
        }
        action={
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={remainingProperties !== null && remainingProperties <= 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        }
      />

      <SlideOver
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Property"
      >
        <AddPropertyForm onClose={() => setIsModalOpen(false)} />
      </SlideOver>

      {properties && properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No properties yet"
          description="Get started by adding your first property."
          action={
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={remainingProperties !== null && remainingProperties <= 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          }
          className="mt-6"
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => {
            const currentUnits = toFiniteNumber(property._count?.units);
            const propertyMaxUnits = toFiniteNumber((property.metadata as { maxUnits?: unknown } | undefined)?.maxUnits);
            const remainingPerProperty =
              propertyMaxUnits > 0 ? Math.max(0, propertyMaxUnits - currentUnits) : null;

            return (
              <Card
                key={property.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/${pgId}/properties/${property.id}`)}
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <StatusBadge status={property.propertyType} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{property.propertyName}</h3>
                  <div className="mb-4 flex items-start text-sm text-slate-600">
                    <MapPin className="mr-1 mt-0.5 h-4 w-4 shrink-0" />
                    <span className="line-clamp-2">
                      {property.addressLine}, {property.city}
                      {property.province && `, ${property.province}`}
                    </span>
                  </div>
                  <div className="space-y-1 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-600">
                      {currentUnits} unit{currentUnits !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {remainingPerProperty !== null
                        ? `${remainingPerProperty} unit slot${remainingPerProperty !== 1 ? 's' : ''} remaining in this property`
                        : remainingOrgUnitSlots !== null
                          ? `${remainingOrgUnitSlots} unit slot${remainingOrgUnitSlots !== 1 ? 's' : ''} remaining in organization`
                          : 'Unlimited unit slots available'}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${pgId}/properties/${property.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
