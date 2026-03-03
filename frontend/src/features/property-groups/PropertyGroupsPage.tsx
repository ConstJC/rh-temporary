'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus, Building2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { SlideOver } from '@/components/common/SlideOver';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { usePropertyGroups, useCreatePropertyGroup, useUpdatePropertyGroup } from '@/features/property-groups/hooks/usePropertyGroups';
import {
  propertyGroupSchema,
  type PropertyGroupFormValues,
} from '@/lib/validations/property-group.schema';
import type { PropertyGroupSummary } from '@/types/domain.types';

type Mode = 'create' | 'edit';

export function PropertyGroupsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = usePropertyGroups();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [selected, setSelected] = useState<PropertyGroupSummary | null>(null);

  const groups = data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PropertyGroupFormValues>({
    resolver: zodResolver(propertyGroupSchema),
    defaultValues: {
      name: '',
      currencyCode: 'PHP',
      timezone: 'Asia/Manila',
    },
  });

  const createMutation = useCreatePropertyGroup();
  const updateMutation = useUpdatePropertyGroup();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setMode('create');
    setSelected(null);
    reset({ name: '', currencyCode: 'PHP', timezone: 'Asia/Manila' });
    setOpen(true);
  }

  function openEdit(group: PropertyGroupSummary) {
    setMode('edit');
    setSelected(group);
    reset({
      name: group.name,
      currencyCode: group.currencyCode ?? 'PHP',
      timezone: group.timezone ?? 'Asia/Manila',
    });
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  async function onSubmit(values: PropertyGroupFormValues) {
    if (mode === 'create') {
      const created = await createMutation.mutateAsync(values);
      setOpen(false);
      if (created?.id) {
        router.push(ROUTES.LANDLORD_OVERVIEW(created.id));
      }
      return;
    }

    if (selected) {
      await updateMutation.mutateAsync({
        id: selected.id,
        payload: values,
      });
      setOpen(false);
    }
  }

  const hasGroups = groups.length > 0;

  const headerTitle = useMemo(
    () => (mode === 'create' ? 'Create Property Group' : 'Edit Property Group'),
    [mode],
  );

  return (
    <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Property Groups
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your organizations. Create a new group or edit existing ones.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          New group
        </button>
      </div>

      {isLoading && (
        <TableSkeleton rows={4} />
      )}

      {!isLoading && (isError || !hasGroups) && (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title={isError ? 'Failed to load property groups' : 'No property groups yet'}
          description={
            isError
              ? 'There was a problem loading your organizations. Please try again.'
              : 'Create your first property group to start managing properties, tenants, and leases.'
          }
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Create property group
            </button>
          }
        />
      )}

      {!isLoading && hasGroups && !isError && (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => router.push(ROUTES.LANDLORD_OVERVIEW(group.id))}
              className="group flex flex-col items-stretch rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-50 text-xs font-bold uppercase text-primary-700">
                    {group.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {group.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {group.currencyCode ?? 'PHP'} · {group.timezone ?? 'Asia/Manila'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(group);
                  }}
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800"
                >
                  Edit
                </button>
              </div>
              {group.subscription && (
                <p className="mt-1 text-xs text-slate-500">
                  Subscription status:{' '}
                  <span className="font-semibold text-slate-700">
                    {group.subscription.status}
                  </span>
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Click to open dashboard for this organization.
              </p>
            </button>
          ))}
        </div>
      )}

      <SlideOver open={open} onClose={close} title={headerTitle}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Organization name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="organization"
              {...register('name')}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="currencyCode"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Currency
            </label>
            <input
              id="currencyCode"
              type="text"
              {...register('currencyCode')}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {errors.currencyCode && (
              <p className="mt-1 text-xs text-danger-600">
                {errors.currencyCode.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Timezone
            </label>
            <input
              id="timezone"
              type="text"
              {...register('timezone')}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {errors.timezone && (
              <p className="mt-1 text-xs text-danger-600">
                {errors.timezone.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create group' : 'Save changes'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

