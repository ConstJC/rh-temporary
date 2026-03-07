'use client';

import { FormEvent, use, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useProperty } from '@/features/landlord/hooks/useProperties';
import { useCreateUnit, useUnit, useUnits } from '@/features/landlord/hooks/useUnits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Home, Search, ArrowUpDown, ChevronUp, ChevronDown, User, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPeso, toFiniteNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SlideOver } from '@/components/common/SlideOver';
import { toast } from 'sonner';
import type { UnitType } from '@/types/domain.types';

const UNIT_STATUS_OPTIONS = ['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'NOT_AVAILABLE'] as const;
const UNIT_TYPE_OPTIONS: Array<{ value: UnitType; label: string }> = [
  { value: 'STUDIO', label: 'Studio' },
  { value: 'BEDROOM', label: 'Bedroom' },
  { value: 'ENTIRE_UNIT', label: 'Entire Unit' },
  { value: 'SHARED_ROOM', label: 'Shared Room' },
  { value: 'DORM', label: 'Dorm' },
  { value: 'OTHER', label: 'Other' },
];

type UnitSortColumn = 'unitName' | 'unitType' | 'monthlyRent' | 'floorNumber' | 'maxOccupants' | 'status';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unable to process request. Please try again.';
}

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ pgId: string; propertyId: string }>;
}) {
  const { pgId, propertyId } = use(params);
  const { data: property, isLoading: propertyLoading } = useProperty(pgId, propertyId);
  const { data: units, isLoading: unitsLoading, isFetching: unitsRefreshing, refetch: refetchUnits } = useUnits(pgId, propertyId);
  const createUnit = useCreateUnit(pgId, propertyId);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof UNIT_STATUS_OPTIONS)[number]>('ALL');
  const [sortColumn, setSortColumn] = useState<UnitSortColumn>('unitName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [unitSheetMode, setUnitSheetMode] = useState<'add' | 'view'>('add');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const { data: selectedUnit, isLoading: selectedUnitLoading } = useUnit(pgId, selectedUnitId ?? '');

  const [unitType, setUnitType] = useState<UnitType>('BEDROOM');
  const [unitName, setUnitName] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [maxOccupants, setMaxOccupants] = useState('');

  const filteredUnits = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return (units ?? []).filter((unit) => {
      const matchesStatus = statusFilter === 'ALL' || unit.status === statusFilter;
      const searchable = `${unit.unitName} ${unit.unitType} ${unit.status} ${unit.floorNumber ?? ''} ${unit.maxOccupants ?? ''} ${unit.monthlyRent ?? ''}`.toLowerCase();
      const matchesSearch = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, statusFilter, units]);

  const sortedUnits = useMemo(() => {
    const sorted = [...filteredUnits];

    sorted.sort((a, b) => {
      const directionFactor = sortDirection === 'asc' ? 1 : -1;

      const readValue = (unit: (typeof filteredUnits)[number]): string | number => {
        if (sortColumn === 'monthlyRent') return toFiniteNumber(unit.monthlyRent);
        if (sortColumn === 'floorNumber') return unit.floorNumber ?? Number.POSITIVE_INFINITY;
        if (sortColumn === 'maxOccupants') return unit.maxOccupants ?? Number.POSITIVE_INFINITY;
        if (sortColumn === 'unitName') return unit.unitName.toLowerCase();
        if (sortColumn === 'unitType') return unit.unitType.toLowerCase();
        return unit.status.toLowerCase();
      };

      const aValue = readValue(a);
      const bValue = readValue(b);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * directionFactor;
      }

      return String(aValue).localeCompare(String(bValue)) * directionFactor;
    });

    return sorted;
  }, [filteredUnits, sortColumn, sortDirection]);

  const unitStats = useMemo(() => {
    return (units ?? []).reduce(
      (acc, unit) => {
        acc.total += 1;
        if (unit.status === 'AVAILABLE') acc.available += 1;
        return acc;
      },
      { total: 0, available: 0 }
    );
  }, [units]);

  const averageRent = useMemo(() => {
    if (!units || units.length === 0) return 0;
    const totalRent = units.reduce((sum, unit) => sum + toFiniteNumber(unit.monthlyRent), 0);
    return totalRent / units.length;
  }, [units]);

  const toggleSort = (column: UnitSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const renderSortIcon = (column: UnitSortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;

    return sortDirection === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
      : <ChevronDown className="h-3.5 w-3.5 text-slate-700" />;
  };

  const openAddUnitSheet = () => {
    setUnitSheetMode('add');
    setSelectedUnitId(null);
    setUnitType('BEDROOM');
    setUnitName('');
    setMonthlyRent('');
    setFloorNumber('');
    setMaxOccupants('');
    setUnitSheetOpen(true);
  };

  const openViewUnitSheet = (unitId: string) => {
    setUnitSheetMode('view');
    setSelectedUnitId(unitId);
    setUnitSheetOpen(true);
  };

  const closeUnitSheet = () => {
    setUnitSheetOpen(false);
    setSelectedUnitId(null);
  };

  async function handleCreateUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const monthlyRentValue = Number(monthlyRent);
    if (!Number.isFinite(monthlyRentValue) || monthlyRentValue < 0) {
      toast.error('Monthly rent must be a valid non-negative amount.');
      return;
    }

    try {
      await createUnit.mutateAsync({
        unitType,
        unitName,
        monthlyRent: monthlyRentValue,
        floorNumber: floorNumber ? Number(floorNumber) : undefined,
        maxOccupants: maxOccupants ? Number(maxOccupants) : undefined,
      });
      toast.success('Unit created');
      closeUnitSheet();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

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
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <div>
                <label className="text-sm font-medium text-slate-600">Available Units</label>
                <p className="mt-1 text-slate-900">{unitStats.available}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Average Rent</label>
                <p className="mt-1 text-slate-900">{formatPeso(averageRent)}/month</p>
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
              <CardTitle>
                Units <span className="text-sm font-normal text-slate-500">({filteredUnits.length}/{unitStats.total})</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetchUnits();
                  }}
                  disabled={unitsRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${unitsRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button size="sm" onClick={openAddUnitSheet}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by unit, type, status, floor, rent"
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <label
                  htmlFor="unit-status-filter"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Status
                </label>
                <select
                  id="unit-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as (typeof UNIT_STATUS_OPTIONS)[number])}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {UNIT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === 'ALL' ? 'All statuses' : status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                  disabled={searchQuery.length === 0 && statusFilter === 'ALL'}
                >
                  Reset
                </Button>
              </div>
            </div>

            {unitsLoading ? (
              <div className="h-32 bg-slate-100 animate-pulse rounded" />
            ) : units && units.length === 0 ? (
              <div className="text-center py-8">
                <Home className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No units yet. Add your first unit.</p>
                <Button size="sm" onClick={openAddUnitSheet}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">No units match your filters.</p>
                <p className="mt-1 text-sm text-slate-500">Try changing the search term or selecting a different status.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead>
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('unitName')}>
                          Unit {renderSortIcon('unitName')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('unitType')}>
                          Type {renderSortIcon('unitType')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('monthlyRent')}>
                          Monthly Rent {renderSortIcon('monthlyRent')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('floorNumber')}>
                          Floor {renderSortIcon('floorNumber')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('maxOccupants')}>
                          Max Occupants {renderSortIcon('maxOccupants')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('status')}>
                          Status {renderSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium text-slate-900">{unit.unitName}</TableCell>
                        <TableCell>{unit.unitType.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{formatPeso(unit.monthlyRent)}/month</TableCell>
                        <TableCell>{unit.floorNumber ?? '—'}</TableCell>
                        <TableCell>{unit.maxOccupants ?? '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={unit.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              openViewUnitSheet(unit.id);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SlideOver
        open={unitSheetOpen}
        onClose={closeUnitSheet}
        title={unitSheetMode === 'add' ? 'Add Unit' : (selectedUnit?.unitName ?? 'Unit Details')}
      >
        {unitSheetMode === 'add' ? (
          <form className="space-y-5" onSubmit={handleCreateUnit}>
            <p className="text-sm text-slate-500">
              {property ? `Create a unit for ${property.propertyName}` : 'Create a new unit'}
            </p>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="sheet-unitType">
                  Unit Type
                </label>
                <select
                  id="sheet-unitType"
                  value={unitType}
                  onChange={(event) => setUnitType(event.target.value as UnitType)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  {UNIT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="sheet-unitName">
                  Unit Name / Number
                </label>
                <Input
                  id="sheet-unitName"
                  value={unitName}
                  onChange={(event) => setUnitName(event.target.value)}
                  placeholder="Room 101"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="sheet-monthlyRent">
                  Monthly Rent
                </label>
                <Input
                  id="sheet-monthlyRent"
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
                <label className="text-sm font-medium text-slate-700" htmlFor="sheet-floorNumber">
                  Floor Number (Optional)
                </label>
                <Input
                  id="sheet-floorNumber"
                  type="number"
                  value={floorNumber}
                  onChange={(event) => setFloorNumber(event.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="sheet-maxOccupants">
                  Maximum Occupants (Optional)
                </label>
                <Input
                  id="sheet-maxOccupants"
                  type="number"
                  min={1}
                  value={maxOccupants}
                  onChange={(event) => setMaxOccupants(event.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeUnitSheet}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUnit.isPending}>
                {createUnit.isPending ? 'Saving...' : 'Create Unit'}
              </Button>
            </div>
          </form>
        ) : selectedUnitLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
        ) : !selectedUnit ? (
          <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
            The unit record could not be loaded.
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Unit Information</CardTitle>
                  <StatusBadge status={selectedUnit.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Property</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedUnit.property?.propertyName ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Unit Type</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedUnit.unitType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Monthly Rent</p>
                    <p className="mt-1 font-medium text-slate-900">{formatPeso(selectedUnit.monthlyRent)}/month</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Floor Number</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedUnit.floorNumber ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Max Occupants</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedUnit.maxOccupants ?? 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUnit.leases?.find((lease) => lease.status === 'ACTIVE') ? (
                  <div className="space-y-2">
                    <div className="flex items-center text-slate-900">
                      <User className="mr-2 h-4 w-4 text-slate-400" />
                      {selectedUnit.leases.find((lease) => lease.status === 'ACTIVE')?.tenant.firstName}{' '}
                      {selectedUnit.leases.find((lease) => lease.status === 'ACTIVE')?.tenant.lastName}
                    </div>
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
        )}
      </SlideOver>
    </>
  );
}
