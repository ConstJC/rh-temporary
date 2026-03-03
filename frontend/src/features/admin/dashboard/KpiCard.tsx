'use client';

import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-6 shadow-sm', className)}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-2 text-3xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

