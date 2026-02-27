'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">RentHub</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
      </div>
      <Suspense fallback={<div className="animate-pulse rounded bg-slate-200 py-8" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-accent-500 hover:text-accent-600 hover:underline">
          Register
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/forgot-password" className="text-slate-500 hover:underline">
          Forgot password?
        </Link>
      </p>
    </div>
  );
}
