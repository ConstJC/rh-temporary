'use client';

import { RegisterForm } from '@/features/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">RentHub</h1>
        <p className="mt-1 text-sm text-slate-500">Create your landlord account</p>
      </div>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent-500 hover:text-accent-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
