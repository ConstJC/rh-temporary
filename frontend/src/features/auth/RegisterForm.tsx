'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { registerSchema, type RegisterDto } from '@/lib/validations/auth.schema';
import { register as registerApi } from '@/lib/api/auth.api';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', firstName: '', lastName: '', password: '' },
  });

  async function onSubmit(data: RegisterDto) {
    setLoading(true);
    try {
      await registerApi(data);
      toast.success('Account created. Please check your email to verify.');
      router.push('/login');
      router.refresh();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <label htmlFor="firstName" className={labelClass}>First name</label>
        <input id="firstName" type="text" autoComplete="given-name" className={inputClass} {...register('firstName')} />
        {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
      </div>
      <div>
        <label htmlFor="lastName" className={labelClass}>Last name</label>
        <input id="lastName" type="text" autoComplete="family-name" className={inputClass} {...register('lastName')} />
        {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" type="password" autoComplete="new-password" className={inputClass} {...register('password')} />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={loading} className={primaryBtnClass}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
