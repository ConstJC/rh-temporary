import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, type SubscriptionPlanFilters } from "@/lib/api/admin.api";
import type { SubscriptionPlanDto } from "@/lib/validations/admin.schema";

export const adminSubscriptionPlanKeys = {
  all: () => ["adminSubscriptionPlans"] as const,
  list: (f: SubscriptionPlanFilters) =>
    ["adminSubscriptionPlans", "list", f] as const,
  accessMenus: () => ["adminSubscriptionPlans", "accessMenus"] as const,
  accessPermissions: () =>
    ["adminSubscriptionPlans", "accessPermissions"] as const,
};

export function useAdminSubscriptionPlans(filters: SubscriptionPlanFilters) {
  return useQuery({
    queryKey: adminSubscriptionPlanKeys.list(filters),
    queryFn: () => adminApi.getSubscriptionPlans(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAccessMenusCatalog() {
  return useQuery({
    queryKey: adminSubscriptionPlanKeys.accessMenus(),
    queryFn: () => adminApi.getAccessMenus(),
    staleTime: 60_000,
  });
}

export function useAccessPermissionsCatalog() {
  return useQuery({
    queryKey: adminSubscriptionPlanKeys.accessPermissions(),
    queryFn: () => adminApi.getAccessPermissions(),
    staleTime: 60_000,
  });
}

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscriptionPlanDto) =>
      adminApi.createSubscriptionPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSubscriptionPlanKeys.all() });
      toast.success("Subscription plan created");
    },
    onError: () => toast.error("Failed to create subscription plan"),
  });
}

export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SubscriptionPlanDto>;
    }) => adminApi.updateSubscriptionPlan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSubscriptionPlanKeys.all() });
      toast.success("Subscription plan updated");
    },
    onError: () => toast.error("Failed to update subscription plan"),
  });
}

export function useUpdateSubscriptionPlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "SUSPENDED";
    }) => adminApi.updateSubscriptionPlanStatus(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: adminSubscriptionPlanKeys.all() });
      toast.success(
        vars.status === "SUSPENDED" ? "Plan deactivated" : "Plan activated",
      );
    },
    onError: () => toast.error("Failed to update plan status"),
  });
}
