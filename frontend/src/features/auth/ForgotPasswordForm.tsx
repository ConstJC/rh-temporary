'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordDto } from '@/lib/validations/auth.schema';
import { forgotPassword } from '@/lib/api/auth.api';

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ForgotPasswordDto) {
    setLoading(true);
    try {
      await forgotPassword(data);
      setSent(true);
      toast.success('If an account exists, you will receive a reset link.');
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message ?? 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-slate-600">
        Check your email for a link to reset your password.
      </p>
    );
  }

  const inputClass =
    'w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
  const errorClass = 'mt-1 text-xs text-danger-600';
  const primaryBtnClass =
    'w-full rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>
      <button type="submit" disabled={loading} className={primaryBtnClass}>
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
