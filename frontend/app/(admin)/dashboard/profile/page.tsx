'use client';

import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <>
      <PageHeader title="My Profile" description="Account information and security settings." />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Basic Info</h2>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
              <p className="mt-1 text-sm text-slate-900">{user?.name ?? 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <p className="mt-1 text-sm text-slate-900">{user?.email ?? 'Not set'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {user?.role && <StatusBadge status={user.role} />}
            {user?.userType && <StatusBadge status={user.userType} />}
            <StatusBadge status={user?.isEmailVerified ? 'USER_ACTIVE' : 'USER_UNVERIFIED'} />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            For full account configuration, open Settings and manage roles/menu permissions there.
          </p>
        </section>
      </div>
    </>
  );
}
