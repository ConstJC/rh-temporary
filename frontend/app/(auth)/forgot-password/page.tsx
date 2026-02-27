'use client';

import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your email to receive a reset link</p>
      </div>
      <ForgotPasswordForm />
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-slate-500 hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
