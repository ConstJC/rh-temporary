'use client';

import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { AdminUser } from '@/types/domain.types';

export function RecentSignupsTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Recent Signups</h3>
        <p className="text-sm text-slate-500">Last 10 landlord registrations.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-semibold text-slate-900">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-6 py-3 text-slate-700">{u.email}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={u.isActive ? 'USER_ACTIVE' : 'USER_INACTIVE'} />
                </td>
                <td className="px-6 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

