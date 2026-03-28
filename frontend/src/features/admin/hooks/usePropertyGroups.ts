import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, type PropertyGroupFilters } from "@/lib/api/admin.api";
import type { CreateAdminPropertyGroupDto } from "@/lib/validations/admin.schema";

export const adminPropertyGroupKeys = {
  all: () => ["adminPropertyGroups"] as const,
  list: (f: PropertyGroupFilters) =>
    ["adminPropertyGroups", "list", f] as const,
  details: (id: string) => ["adminPropertyGroups", "details", id] as const,
};

export function useAdminPropertyGroups(filters: PropertyGroupFilters) {
  return useQuery({
    queryKey: adminPropertyGroupKeys.list(filters),
    queryFn: () => adminApi.getPropertyGroups(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpdatePropertyGroupStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "ACTIVE" | "SUSPENDED";
      notes?: string;
    }) => adminApi.updatePropertyGroup(id, { status, notes }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: adminPropertyGroupKeys.all() });
      toast.success(
        status === "SUSPENDED"
          ? "Property group suspended"
          : "Property group reactivated",
      );
    },
    onError: () => toast.error("Failed to update property group"),
  });
}

export function useAdminPropertyGroupDetails(
  id?: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: adminPropertyGroupKeys.details(id ?? ""),
    queryFn: () => adminApi.getPropertyGroupDetails(id as string),
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
  });
}

export function useUpdatePropertyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { groupName?: string; currencyCode?: string; timezone?: string };
    }) => adminApi.updatePropertyGroup(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: adminPropertyGroupKeys.all() });
      qc.invalidateQueries({
        queryKey: adminPropertyGroupKeys.details(vars.id),
      });
      toast.success("Property group updated");
    },
    onError: () => toast.error("Failed to update property group"),
  });
}

export function useCreateAdminPropertyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdminPropertyGroupDto) =>
      adminApi.createPropertyGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminPropertyGroupKeys.all() });
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Property group created successfully");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to create property group"),
  });
}
