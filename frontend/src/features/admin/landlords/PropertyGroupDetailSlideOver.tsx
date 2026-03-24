"use client";

import { useState } from "react";
import { SlideOver } from "@/components/common/SlideOver";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminPropertyGroupDetail } from "@/types/domain.types";
import { useUpdatePropertyGroup } from "@/features/admin/hooks/usePropertyGroups";

export function PropertyGroupDetailSlideOver({
  group,
  open,
  onClose,
  mode = "view",
}: {
  group: AdminPropertyGroupDetail | null;
  open: boolean;
  onClose: () => void;
  mode?: "view" | "edit";
}) {
  const updateMutation = useUpdatePropertyGroup();
  const [groupName, setGroupName] = useState(group?.groupName ?? "");
  const [currencyCode, setCurrencyCode] = useState(group?.currencyCode ?? "");
  const [timezone, setTimezone] = useState(group?.timezone ?? "");

  const isEditMode = mode === "edit";
  const resolvedPgCode =
    group?.pgCode ??
    (typeof group?.pgNumber === "number"
      ? `PG-${String(group.pgNumber).padStart(3, "0")}`
      : null);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit property group" : "Property group details"}
      className="w-full sm:max-w-xl lg:max-w-2xl"
    >
      {!group ? (
        <p className="text-sm text-slate-500">
          Loading property group details...
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Organization
            </p>
            {isEditMode ? (
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Group Name
                  </label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Currency Code
                  </label>
                  <input
                    value={currencyCode}
                    onChange={(e) =>
                      setCurrencyCode(e.target.value.toUpperCase())
                    }
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Timezone
                  </label>
                  <input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {group.groupName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {group.currencyCode} · {group.timezone}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Property Group ID: {group.pgNumber}
                  {resolvedPgCode ? ` (${resolvedPgCode})` : ""}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={
                group.status === "SUSPENDED" ? "USER_INACTIVE" : "USER_ACTIVE"
              }
            />
            <StatusBadge
              status={`SUB_${group.subscription.status}`.toUpperCase()}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Owner
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {group.owner.firstName} {group.owner.lastName}
            </p>
            <p className="text-sm text-slate-700">{group.owner.email}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Properties
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {group._count.properties}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Units
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {group._count.units}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Members
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {group._count.members}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Joined
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {formatDate(group.createdAt)}
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Properties & Units
            </p>
            {group.properties.length === 0 ? (
              <p className="text-sm text-slate-500">
                No properties found for this group.
              </p>
            ) : (
              group.properties.map((property) => (
                <div
                  key={property.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {property.propertyName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {property.propertyType.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {property.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Units
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {property.unitCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(property.unitStatusCounts).map(
                      ([status, count]) => (
                        <span
                          key={status}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {status.replaceAll("_", " ")}: {count}
                        </span>
                      ),
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    {property.units.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No units in this property.
                      </p>
                    ) : (
                      property.units.map((unit) => (
                        <div
                          key={unit.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {unit.unitName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {unit.unitType.replaceAll("_", " ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={unit.status} />
                            <span className="text-xs font-semibold text-slate-700">
                              {formatCurrency(
                                unit.monthlyRent,
                                group.currencyCode,
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {isEditMode && (
            <div className="flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={async () => {
                  if (!group) return;
                  await updateMutation.mutateAsync({
                    id: group.id,
                    data: {
                      groupName,
                      currencyCode,
                      timezone,
                    },
                  });
                  onClose();
                }}
                disabled={updateMutation.isPending}
                className="h-10 rounded-md bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}
    </SlideOver>
  );
}
