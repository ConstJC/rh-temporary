'use client';

import { useState } from 'react';
import { SlideOver } from '@/components/common/SlideOver';
import { subscriptionPlanSchema, type SubscriptionPlanDto } from '@/lib/validations/admin.schema';
import type { AdminSubscriptionPlan } from '@/types/domain.types';

interface SubscriptionPlanFormSheetProps {
  open: boolean;
  onClose: () => void;
  initialData?: AdminSubscriptionPlan | null;
  onSubmit: (data: SubscriptionPlanDto) => Promise<void>;
  loading?: boolean;
}

interface FormState {
  name: string;
  priceMonthly: string;
  maxUnits: string;
  maxProperties: string;
}

const emptyForm: FormState = {
  name: '',
  priceMonthly: '',
  maxUnits: '',
  maxProperties: '',
};

function toFormState(initialData?: AdminSubscriptionPlan | null): FormState {
  if (!initialData) return emptyForm;
  return {
    name: initialData.name,
    priceMonthly: String(initialData.priceMonthly),
    maxUnits: String(initialData.maxUnits),
    maxProperties: String(initialData.maxProperties),
  };
}

export function SubscriptionPlanFormSheet({
  open,
  onClose,
  initialData,
  onSubmit,
  loading = false,
}: SubscriptionPlanFormSheetProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = subscriptionPlanSchema.safeParse({
      name: form.name.trim(),
      priceMonthly: Number(form.priceMonthly),
      maxUnits: Number(form.maxUnits),
      maxProperties: Number(form.maxProperties),
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormState | undefined;
        if (field && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    await onSubmit(parsed.data);
    onClose();
  }

  const title = initialData ? 'Edit Subscription Plan' : 'Create Subscription Plan';

  return (
    <SlideOver open={open} onClose={onClose} title={title} className="w-full sm:max-w-xl">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="plan-name">
            Plan Name
          </label>
          <input
            id="plan-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
            placeholder="e.g. Starter"
          />
          {errors.name && <p className="text-xs text-danger-600">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="plan-price">
              Monthly Price
            </label>
            <input
              id="plan-price"
              type="number"
              min={0}
              step="0.01"
              value={form.priceMonthly}
              onChange={(e) => setForm((p) => ({ ...p, priceMonthly: e.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
              placeholder="0.00"
            />
            {errors.priceMonthly && <p className="text-xs text-danger-600">{errors.priceMonthly}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="plan-units">
              Max Units
            </label>
            <input
              id="plan-units"
              type="number"
              min={0}
              step="1"
              value={form.maxUnits}
              onChange={(e) => setForm((p) => ({ ...p, maxUnits: e.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
              placeholder="0"
            />
            {errors.maxUnits && <p className="text-xs text-danger-600">{errors.maxUnits}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="plan-properties">
            Max Properties
          </label>
          <input
            id="plan-properties"
            type="number"
            min={0}
            step="1"
            value={form.maxProperties}
            onChange={(e) => setForm((p) => ({ ...p, maxProperties: e.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
            placeholder="0"
          />
          {errors.maxProperties && <p className="text-xs text-danger-600">{errors.maxProperties}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 rounded-md bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </form>
    </SlideOver>
  );
}
