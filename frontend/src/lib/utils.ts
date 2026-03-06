import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

export function formatPeriod(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatPeso(value: unknown): string {
  return `₱${toFiniteNumber(value).toLocaleString()}`;
}

export function toDateOrNull(value: unknown): Date | null {
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}
