import { cn } from "@/lib/utils";

const statusMap = {
  PAID: "bg-success-100 text-success-700 border-success-200",
  UNPAID: "bg-slate-100 text-slate-600 border-slate-200",
  PARTIAL: "bg-warning-100 text-warning-700 border-warning-200",
  OVERDUE: "bg-danger-100 text-danger-700 border-danger-200",
  ACTIVE: "bg-primary-100 text-primary-700 border-primary-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
  EXPIRED: "bg-warning-100 text-warning-700 border-warning-200",
  AVAILABLE: "bg-success-100 text-success-700 border-success-200",
  OCCUPIED: "bg-primary-100 text-primary-700 border-primary-200",
  MAINTENANCE: "bg-orange-100 text-orange-700 border-orange-200",
  NOT_AVAILABLE: "bg-slate-100 text-slate-600 border-slate-200",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  PENDING: "bg-slate-100 text-slate-600 border-slate-200",
  MOVED_OUT: "bg-slate-100 text-slate-600 border-slate-200",
  BLACKLISTED: "bg-danger-100 text-danger-700 border-danger-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",

  // Admin portal: user account status
  USER_ACTIVE: "bg-success-100 text-success-700 border-success-200",
  USER_INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
  USER_UNVERIFIED: "bg-warning-100 text-warning-700 border-warning-200",

  // Admin portal: user type
  SYSTEM_ADMIN: "bg-primary-100 text-primary-700 border-primary-200",
  LANDLORD: "bg-accent-100 text-accent-600 border-accent-200",
  TENANT: "bg-success-100 text-success-700 border-success-200",

  // Admin portal: subscription status
  SUB_ACTIVE: "bg-success-100 text-success-700 border-success-200",
  SUB_TRIAL: "bg-accent-100 text-accent-600 border-accent-200",
  SUB_EXPIRED: "bg-danger-100 text-danger-700 border-danger-200",
  SUB_CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",

  // Admin portal: audit actions
  AUDIT_INSERT: "bg-success-100 text-success-700 border-success-200",
  AUDIT_UPDATE: "bg-accent-100 text-accent-600 border-accent-200",
  AUDIT_DELETE: "bg-danger-100 text-danger-700 border-danger-200",

  // Admin portal: addon billing types
  FIXED_AMENITY: "bg-primary-100 text-primary-700 border-primary-200",
  FLAT_FEE: "bg-accent-100 text-accent-600 border-accent-200",
  METERED: "bg-warning-100 text-warning-700 border-warning-200",

  // Admin portal: org status
  SUSPENDED: "bg-danger-100 text-danger-700 border-danger-200",
} as const;

type StatusKey = keyof typeof statusMap;

const labelMap: Record<StatusKey, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  OVERDUE: "Overdue",
  ACTIVE: "Active",
  CLOSED: "Closed",
  EXPIRED: "Expired",
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
  NOT_AVAILABLE: "Not Available",
  DRAFT: "Draft",
  PENDING: "Pending",
  MOVED_OUT: "Moved Out",
  BLACKLISTED: "Blacklisted",
  CANCELLED: "Cancelled",

  USER_ACTIVE: "Active",
  USER_INACTIVE: "Inactive",
  USER_UNVERIFIED: "Unverified",

  SYSTEM_ADMIN: "System Admin",
  LANDLORD: "Landlord",
  TENANT: "Tenant",

  SUB_ACTIVE: "Active",
  SUB_TRIAL: "Trial",
  SUB_EXPIRED: "Expired",
  SUB_CANCELLED: "Cancelled",

  AUDIT_INSERT: "Insert",
  AUDIT_UPDATE: "Update",
  AUDIT_DELETE: "Delete",

  FIXED_AMENITY: "Fixed Amenity",
  FLAT_FEE: "Flat Fee",
  METERED: "Metered",

  SUSPENDED: "Suspended",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status as StatusKey;
  const style =
    statusMap[key] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const label = labelMap[key] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
