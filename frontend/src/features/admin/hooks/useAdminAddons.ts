"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import { toast } from "sonner";
import type { AddonDto } from "@/lib/validations/admin.schema";

export const adminAddonKeys = {
  all: ["admin", "addons"] as const,
};

export function useAdminAddons() {
  return useQuery({
    queryKey: adminAddonKeys.all,
    queryFn: () => adminApi.getAddons(),
  });
}

export function useCreateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddonDto) => adminApi.createAddon(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminAddonKeys.all });
      toast.success("Add-on created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddonDto> }) =>
      adminApi.updateAddon(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminAddonKeys.all });
      toast.success("Add-on updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAddon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminAddonKeys.all });
      toast.success("Add-on deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
