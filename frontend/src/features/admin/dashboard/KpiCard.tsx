"use client";

import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-xl font-extrabold text-slate-900 xl:text-2xl">
        {value}
      </div>
    </div>
  );
}
