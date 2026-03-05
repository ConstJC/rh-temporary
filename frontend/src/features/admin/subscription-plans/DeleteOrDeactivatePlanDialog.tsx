'use client';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { AdminSubscriptionPlan } from '@/types/domain.types';

interface DeleteOrDeactivatePlanDialogProps {
  open: boolean;
  plan: AdminSubscriptionPlan | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteOrDeactivatePlanDialog({
  open,
  plan,
  loading = false,
  onOpenChange,
  onConfirm,
}: DeleteOrDeactivatePlanDialogProps) {
  const isDeactivate = plan?.status === 'ACTIVE';

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isDeactivate ? 'Deactivate subscription plan?' : 'Activate subscription plan?'}
      description={
        isDeactivate
          ? `This will hide ${plan?.name ?? 'this plan'} from active use.`
          : `This will make ${plan?.name ?? 'this plan'} available again.`
      }
      confirmLabel={isDeactivate ? 'Deactivate' : 'Activate'}
      variant={isDeactivate ? 'destructive' : 'default'}
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}
