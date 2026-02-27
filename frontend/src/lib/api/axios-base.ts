import axios, { type AxiosError } from 'axios';
import { normalizeApiError } from '@/types/api.types';

const baseURL =
  typeof window !== 'undefined'
    ? `${process.env.NEXT_PUBLIC_API_URL ?? ''}`.replace(/\/$/, '')
    : process.env.NEXT_PUBLIC_API_URL ?? '';

/** Plain axios for unauthenticated auth calls (login, register, forgot, reset, verify). Safe to use from server (NextAuth). */
export const authHttp = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

authHttp.interceptors.response.use((res) => res, (err: AxiosError) => Promise.reject(normalizeApiError(err)));
