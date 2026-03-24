"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePropertyGroup } from "@/hooks/usePropertyGroup";
import { useSubscription } from "@/features/landlord/hooks/useOverviewStats";
import { toFiniteNumber } from "@/lib/utils";

export default function SubscriptionPage() {
  const { pgId, group } = usePropertyGroup();
  const { data: subscription, isLoading } = useSubscription(pgId);

  const usageRows = useMemo(() => {
    const properties = toFiniteNumber(subscription?.usage.properties);
    const units = toFiniteNumber(subscription?.usage.units);
    const tenants = toFiniteNumber(subscription?.usage.tenants);

    const propertyLimit = toFiniteNumber(subscription?.plan.propertyLimit);
    const unitLimit = toFiniteNumber(subscription?.plan.unitLimit);
    const unitLimitPerProperty = toFiniteNumber(
      subscription?.plan.unitLimitPerProperty,
    );
    const tenantLimit = toFiniteNumber(subscription?.plan.tenantLimit);

    return [
      {
        label: "Properties",
        usage: properties,
        limit: propertyLimit,
      },
      {
        label: "Units (Org Total)",
        usage: units,
        limit: unitLimit,
      },
      {
        label: "Units (Per Property)",
        usage: null,
        limit: unitLimitPerProperty,
      },
      {
        label: "Tenants",
        usage: tenants,
        limit: tenantLimit,
      },
    ];
  }, [subscription]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const code of subscription?.plan.access.permissions ?? []) {
      const [module] = code.split("_");
      const values = groups.get(module) ?? [];
      values.push(code);
      groups.set(module, values);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [subscription?.plan.access.permissions]);

  return (
    <>
      <PageHeader
        title="Subscription"
        description="Plan access, permissions, and usage"
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Organization:</strong> {group?.name ?? "N/A"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {subscription?.status ?? (isLoading ? "Loading..." : "N/A")}
            </p>
            <p>
              <strong>Plan:</strong> {subscription?.plan.planName ?? "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Limits and Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {usageRows.map((row) => {
              const limitLabel = row.limit === 0 ? "Unlimited" : row.limit;
              const usageLabel = row.usage == null ? "N/A" : row.usage;
              return (
                <p key={row.label}>
                  <strong>{row.label}:</strong> {usageLabel} / {limitLabel}
                </p>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enabled Menus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {(subscription?.plan.access.menus ?? []).length === 0 ? (
              <p>No menu access configured.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1">
                {(subscription?.plan.access.menus ?? []).map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permission Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            {permissionGroups.length === 0 ? (
              <p>No permission access configured.</p>
            ) : (
              permissionGroups.map(([moduleCode, codes]) => (
                <div key={moduleCode}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {moduleCode}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {codes.join(", ")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
