'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Set new password</h1>
        <p className="mt-1 text-sm text-slate-500">Use the token from your email</p>
      </div>
      <Suspense fallback={<div className="animate-pulse rounded bg-slate-200 py-8" />}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-slate-500 hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
