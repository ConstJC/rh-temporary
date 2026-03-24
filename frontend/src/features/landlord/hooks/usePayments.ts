"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { landlordApi } from "@/lib/api/landlord.api";
import { landlordKeys } from "./landlord-keys";

export function usePayments(pgId: string) {
  return useQuery({
    queryKey: landlordKeys.payments(pgId),
    queryFn: () => landlordApi.getPayments(pgId),
    enabled: !!pgId,
  });
}

export function usePayment(pgId: string, paymentId: string) {
  return useQuery({
    queryKey: landlordKeys.payment(pgId, paymentId),
    queryFn: () => landlordApi.getPayment(pgId, paymentId),
    enabled: !!pgId && !!paymentId,
  });
}

export function useRecordPayment(pgId: string, paymentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof landlordApi.recordPayment>[2]) =>
      landlordApi.recordPayment(pgId, paymentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.payments(pgId) });
      queryClient.invalidateQueries({
        queryKey: landlordKeys.payment(pgId, paymentId),
      });
      queryClient.invalidateQueries({ queryKey: landlordKeys.overview(pgId) });
    },
  });
}
