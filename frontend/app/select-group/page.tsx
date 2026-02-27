'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listPropertyGroups } from '@/lib/api/property-groups.api';
import { ROUTES } from '@/lib/constants';

export default function SelectGroupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'redirect' | 'empty' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    listPropertyGroups()
      .then((groups) => {
        if (cancelled) return;
        const active = groups.filter((g) => g.subscription?.status !== 'EXPIRED');
        if (active.length > 0) {
          setStatus('redirect');
          router.replace(ROUTES.LANDLORD_OVERVIEW(active[0].id));
        } else {
          setStatus('empty');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (status === 'empty' || status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4">
        <p className="text-center text-slate-600">
          {status === 'empty' ? 'No property group found. Create one to get started.' : 'Failed to load property groups.'}
        </p>
        <a
          href="/dashboard"
          className="rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          Go to dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-600">Redirecting…</p>
    </div>
  );
}
