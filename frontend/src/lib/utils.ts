import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function decimalLikeToNumber(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as { s?: unknown; e?: unknown; d?: unknown };
  if (!Array.isArray(candidate.d) || typeof candidate.e !== "number")
    return null;

  const digits = candidate.d.map((part, index) => {
    const n = typeof part === "number" ? part : Number(part);
    if (!Number.isFinite(n)) return null;
    const normalized = String(Math.trunc(Math.abs(n)));
    return index === 0 ? normalized : normalized.padStart(7, "0");
  });

  if (digits.some((part) => part === null)) return null;

  const coefficient = digits.join("");
  if (!coefficient || coefficient === "0") return 0;

  const sign = candidate.s === -1 ? "-" : "";
  const exponent = candidate.e - (coefficient.length - 1);
  const parsed = Number(`${sign}${coefficient}e${exponent}`);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrency(amount: unknown, currencyCode = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toFiniteNumber(amount));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatPeriod(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const decimalLike = decimalLikeToNumber(value);
  if (decimalLike != null) return decimalLike;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : fallback;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatPeso(value: unknown): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toFiniteNumber(value));
}

export function toDateOrNull(value: unknown): Date | null {
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}
