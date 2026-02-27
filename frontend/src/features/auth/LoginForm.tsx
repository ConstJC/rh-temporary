'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { loginSchema, type LoginDto } from '@/lib/validations/auth.schema';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? undefined;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginDto) {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
        return;
      }
      if (result?.ok) {
        toast.success('Signed in successfully');
        // Redirect to root; middleware will send Admin+System Admin → /dashboard, User+Landlord → /select-group (then overview)
        const url = callbackUrl ?? '/';
        router.push(url);
        router.refresh();
      }
    } catch (e) {
      toast.error('Something went wrong. Please try again.');
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
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" type="password" autoComplete="current-password" className={inputClass} {...register('password')} />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={loading} className={primaryBtnClass}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
