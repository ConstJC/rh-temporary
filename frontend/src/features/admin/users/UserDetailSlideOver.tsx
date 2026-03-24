"use client";

import { SlideOver } from "@/components/common/SlideOver";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { AdminUser } from "@/types/domain.types";

export function UserDetailSlideOver({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SlideOver open={open} onClose={onClose} title="User details">
      {!user ? (
        <p className="text-sm text-slate-500">No user selected.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </p>
            <p className="mt-1 text-sm text-slate-800">{user.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={user.userType} />
            <StatusBadge
              status={user.isActive ? "USER_ACTIVE" : "USER_INACTIVE"}
            />
            <StatusBadge
              status={user.isEmailVerified ? "ACTIVE" : "USER_UNVERIFIED"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Property groups
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {user._count.propertyGroups}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Joined
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}
