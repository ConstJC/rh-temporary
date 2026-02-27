'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { verifyEmailSchema, type VerifyEmailDto } from '@/lib/validations/auth.schema';
import { verifyEmail } from '@/lib/api/auth.api';

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailDto>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token: tokenFromUrl },
  });

  async function onSubmit(data: VerifyEmailDto) {
    setLoading(true);
    try {
      await verifyEmail(data);
      toast.success('Email verified. You can sign in now.');
      router.push('/login');
      router.refresh();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message ?? 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
  const errorClass = 'mt-1 text-xs text-danger-600';
  const primaryBtnClass =
    'w-full rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="token" className={labelClass}>Verification token</label>
        <input id="token" type="text" autoComplete="one-time-code" className={inputClass} {...register('token')} />
        {errors.token && <p className={errorClass}>{errors.token.message}</p>}
      </div>
      <button type="submit" disabled={loading} className={primaryBtnClass}>
        {loading ? 'Verifying…' : 'Verify email'}
      </button>
    </form>
  );
}
