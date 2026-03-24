"use client";

import { useMemo, useState } from "react";
import { SlideOver } from "@/components/common/SlideOver";
import {
  subscriptionPlanSchema,
  type SubscriptionPlanDto,
} from "@/lib/validations/admin.schema";
import type { AdminSubscriptionPlan } from "@/types/domain.types";
import type {
  AccessMenuCatalogItem,
  AccessPermissionCatalogItem,
} from "@/lib/api/admin.api";

interface SubscriptionPlanFormSheetProps {
  open: boolean;
  onClose: () => void;
  initialData?: AdminSubscriptionPlan | null;
  onSubmit: (data: SubscriptionPlanDto) => Promise<void>;
  menuCatalog: AccessMenuCatalogItem[];
  permissionCatalog: AccessPermissionCatalogItem[];
  copySourcePlans: AdminSubscriptionPlan[];
  loading?: boolean;
}

interface FormState {
  name: string;
  priceMonthly: string;
  maxUnits: string;
  maxUnitsPerProperty: string;
  maxProperties: string;
  maxTenants: string;
  menuCodes: string[];
  permissionCodes: string[];
}

const emptyForm: FormState = {
  name: "",
  priceMonthly: "",
  maxUnits: "",
  maxUnitsPerProperty: "",
  maxProperties: "",
  maxTenants: "",
  menuCodes: [],
  permissionCodes: [],
};

function toFormState(initialData?: AdminSubscriptionPlan | null): FormState {
  if (!initialData) return emptyForm;
  return {
    name: initialData.name,
    priceMonthly: String(initialData.priceMonthly),
    maxUnits: String(initialData.maxUnits),
    maxUnitsPerProperty: String(initialData.maxUnitsPerProperty ?? 0),
    maxProperties: String(initialData.maxProperties),
    maxTenants: String(initialData.maxTenants ?? 0),
    menuCodes: initialData.menuCodes ?? [],
    permissionCodes: initialData.permissionCodes ?? [],
  };
}

export function SubscriptionPlanFormSheet({
  open,
  onClose,
  initialData,
  onSubmit,
  menuCatalog,
  permissionCatalog,
  copySourcePlans,
  loading = false,
}: SubscriptionPlanFormSheetProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [copyFromPlanId, setCopyFromPlanId] = useState("");

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, AccessPermissionCatalogItem[]>();
    for (const permission of permissionCatalog) {
      const list = groups.get(permission.moduleCode) ?? [];
      list.push(permission);
      groups.set(permission.moduleCode, list);
    }
    return Array.from(groups.entries());
  }, [permissionCatalog]);

  const selectableCopyPlans = useMemo(
    () =>
      copySourcePlans.filter(
        (plan) => !initialData || plan.id !== initialData.id,
      ),
    [copySourcePlans, initialData],
  );

  const toggleCode = (field: "menuCodes" | "permissionCodes", code: string) => {
    setForm((prev) => {
      const exists = prev[field].includes(code);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((item) => item !== code)
          : [...prev[field], code],
      };
    });
  };

  const applyCopyFromPlan = () => {
    if (!copyFromPlanId) return;
    const source = selectableCopyPlans.find(
      (plan) => plan.id === copyFromPlanId,
    );
    if (!source) return;

    setForm((prev) => ({
      ...prev,
      priceMonthly: String(source.priceMonthly),
      maxUnits: String(source.maxUnits),
      maxUnitsPerProperty: String(source.maxUnitsPerProperty),
      maxProperties: String(source.maxProperties),
      maxTenants: String(source.maxTenants),
      menuCodes: source.menuCodes,
      permissionCodes: source.permissionCodes,
      name: prev.name || `Copy of ${source.name}`,
    }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = subscriptionPlanSchema.safeParse({
      name: form.name.trim(),
      priceMonthly: Number(form.priceMonthly),
      maxUnits: Number(form.maxUnits),
      maxUnitsPerProperty: Number(form.maxUnitsPerProperty),
      maxProperties: Number(form.maxProperties),
      maxTenants: Number(form.maxTenants),
      menuCodes: form.menuCodes,
      permissionCodes: form.permissionCodes,
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

  const title = initialData
    ? "Edit Subscription Plan"
    : "Create Subscription Plan";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={title}
      className="w-full sm:max-w-2xl"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <select
              value={copyFromPlanId}
              onChange={(e) => setCopyFromPlanId(e.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value="">Copy from existing plan...</option>
              {selectableCopyPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyCopyFromPlan}
              disabled={!copyFromPlanId}
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="plan-name"
          >
            Plan Name
          </label>
          <input
            id="plan-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
            placeholder="e.g. Starter"
          />
          {errors.name && (
            <p className="text-xs text-danger-600">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="plan-price"
            >
              Monthly Price
            </label>
            <input
              id="plan-price"
              type="number"
              min={0}
              step="0.01"
              value={form.priceMonthly}
              onChange={(e) =>
                setForm((p) => ({ ...p, priceMonthly: e.target.value }))
              }
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
              placeholder="0.00"
            />
            {errors.priceMonthly && (
              <p className="text-xs text-danger-600">{errors.priceMonthly}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="plan-properties"
            >
              Max Properties
            </label>
            <input
              id="plan-properties"
              type="number"
              min={0}
              step="1"
              value={form.maxProperties}
              onChange={(e) =>
                setForm((p) => ({ ...p, maxProperties: e.target.value }))
              }
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
              placeholder="0"
            />
            {errors.maxProperties && (
              <p className="text-xs text-danger-600">{errors.maxProperties}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="plan-units"
            >
              Max Units (Org Total)
            </label>
            <input
              id="plan-units"
              type="number"
              min={0}
              step="1"
              value={form.maxUnits}
              onChange={(e) =>
                setForm((p) => ({ ...p, maxUnits: e.target.value }))
              }
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
              placeholder="0"
            />
            {errors.maxUnits && (
              <p className="text-xs text-danger-600">{errors.maxUnits}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="plan-units-per-property"
            >
              Max Units Per Property
            </label>
            <input
              id="plan-units-per-property"
              type="number"
              min={0}
              step="1"
              value={form.maxUnitsPerProperty}
              onChange={(e) =>
                setForm((p) => ({ ...p, maxUnitsPerProperty: e.target.value }))
              }
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
              placeholder="0"
            />
            {errors.maxUnitsPerProperty && (
              <p className="text-xs text-danger-600">
                {errors.maxUnitsPerProperty}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="plan-tenants"
            >
              Max Tenants
            </label>
            <input
              id="plan-tenants"
              type="number"
              min={0}
              step="1"
              value={form.maxTenants}
              onChange={(e) =>
                setForm((p) => ({ ...p, maxTenants: e.target.value }))
              }
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary-500"
              placeholder="0"
            />
            {errors.maxTenants && (
              <p className="text-xs text-danger-600">{errors.maxTenants}</p>
            )}
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Menu Access</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {menuCatalog.map((menu) => {
              const checked = form.menuCodes.includes(menu.code);
              return (
                <label
                  key={menu.code}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCode("menuCodes", menu.code)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>{menu.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Permission Access
          </h3>
          <div className="space-y-3">
            {permissionGroups.map(([moduleCode, items]) => (
              <div
                key={moduleCode}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {moduleCode}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items.map((permission) => {
                    const checked = form.permissionCodes.includes(
                      permission.code,
                    );
                    return (
                      <label
                        key={permission.code}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleCode("permissionCodes", permission.code)
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span>{permission.code}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Summary:</span>{" "}
            {form.menuCodes.length} menus, {form.permissionCodes.length}{" "}
            permissions selected.
          </p>
        </section>

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
            {loading
              ? "Saving..."
              : initialData
                ? "Save Changes"
                : "Create Plan"}
          </button>
        </div>
      </form>
    </SlideOver>
  );
}
