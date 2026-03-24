"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPropertyGroups } from "@/lib/api/property-groups.api";
import type { PropertyGroupSummary } from "@/types/domain.types";

interface PropertyGroupContextValue {
  pgId: string;
  group: PropertyGroupSummary | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

const PropertyGroupContext = createContext<PropertyGroupContextValue | null>(
  null,
);

export function PropertyGroupProvider({
  pgId,
  children,
}: {
  pgId: string;
  children: React.ReactNode;
}) {
  const {
    data: groups,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["property-groups"],
    queryFn: listPropertyGroups,
  });
  const group = useMemo(
    () => groups?.find((g) => g.id === pgId) ?? null,
    [groups, pgId],
  );

  const value = useMemo<PropertyGroupContextValue>(
    () => ({
      pgId,
      group,
      isLoading,
      error: error ?? null,
      refetch,
    }),
    [pgId, group, isLoading, error, refetch],
  );

  return (
    <PropertyGroupContext.Provider value={value}>
      {children}
    </PropertyGroupContext.Provider>
  );
}

export function usePropertyGroup(): PropertyGroupContextValue {
  const ctx = useContext(PropertyGroupContext);
  if (!ctx)
    throw new Error(
      "usePropertyGroup must be used within PropertyGroupProvider",
    );
  return ctx;
}

export function useOptionalPropertyGroup(): PropertyGroupContextValue | null {
  return useContext(PropertyGroupContext);
}
