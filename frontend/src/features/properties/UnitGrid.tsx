'use client';

import type { Unit } from '@/types/domain.types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const UNIT_TYPE_LABEL: Record<string, string> = {
  STUDIO: 'Studio',
  BEDROOM: 'Bedroom',
  ENTIRE_UNIT: 'Entire Unit',
  SHARED_ROOM: 'Shared Room',
  DORM: 'Dorm',
  OTHER: 'Other',
};

interface UnitGridProps {
  units: Unit[];
  currencyCode?: string;
  onUnitClick?: (unit: Unit) => void;
  onAddUnit?: () => void;
}

export function UnitGrid({
  units,
  currencyCode = 'PHP',
  onUnitClick,
  onAddUnit,
}: UnitGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {units.map((unit) => (
        <button
          key={unit.id}
          type="button"
          onClick={() => onUnitClick?.(unit)}
          className={cn(
            'rounded-lg border p-4 text-left transition-colors',
            'border-slate-200 bg-white hover:border-primary-200 hover:bg-primary-50/50',
            unit.status === 'AVAILABLE' && 'border-success-200 bg-success-50/30',
            unit.status === 'OCCUPIED' && 'border-primary-200 bg-primary-50/30',
            unit.status === 'MAINTENANCE' && 'border-warning-200 bg-warning-50/30'
          )}
        >
          <div className="flex items-start justify-between">
            <span className="font-medium text-slate-900">{unit.unitName}</span>
            <StatusBadge status={unit.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {UNIT_TYPE_LABEL[unit.unitType] ?? unit.unitType} · {formatCurrency(Number(unit.monthlyRent), currencyCode)}/mo
          </p>
          {unit.activeTenantName && (
            <p className="mt-1 text-xs text-slate-600">Tenant: {unit.activeTenantName}</p>
          )}
        </button>
      ))}
      {onAddUnit && (
        <button
          type="button"
          onClick={onAddUnit}
          className={cn(
            'flex min-h-[100px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-500',
            'hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700'
          )}
        >
          <span className="text-sm font-medium">+ Add Unit</span>
        </button>
      )}
    </div>
  );
}
