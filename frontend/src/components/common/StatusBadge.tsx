import { cn } from '@/lib/utils';

const statusMap = {
  PAID: 'bg-success-100 text-success-700 border-success-200',
  UNPAID: 'bg-slate-100 text-slate-600 border-slate-200',
  PARTIAL: 'bg-warning-100 text-warning-700 border-warning-200',
  OVERDUE: 'bg-danger-100 text-danger-700 border-danger-200',
  ACTIVE: 'bg-primary-100 text-primary-700 border-primary-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  EXPIRED: 'bg-warning-100 text-warning-700 border-warning-200',
  AVAILABLE: 'bg-success-100 text-success-700 border-success-200',
  OCCUPIED: 'bg-primary-100 text-primary-700 border-primary-200',
  MAINTENANCE: 'bg-orange-100 text-orange-700 border-orange-200',
  NOT_AVAILABLE: 'bg-slate-100 text-slate-600 border-slate-200',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
  MOVED_OUT: 'bg-slate-100 text-slate-600 border-slate-200',
  BLACKLISTED: 'bg-danger-100 text-danger-700 border-danger-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

type StatusKey = keyof typeof statusMap;

const labelMap: Record<StatusKey, string> = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  OVERDUE: 'Overdue',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  EXPIRED: 'Expired',
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
  NOT_AVAILABLE: 'Not Available',
  DRAFT: 'Draft',
  PENDING: 'Pending',
  MOVED_OUT: 'Moved Out',
  BLACKLISTED: 'Blacklisted',
  CANCELLED: 'Cancelled',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status as StatusKey;
  const style = statusMap[key] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const label = labelMap[key] ?? status.replace(/_/g, ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
