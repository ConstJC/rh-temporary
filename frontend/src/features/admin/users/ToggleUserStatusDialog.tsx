"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { AdminUser } from "@/types/domain.types";
import { useToggleUserStatus } from "@/features/admin/hooks/useAdminUsers";

export function ToggleUserStatusDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useToggleUserStatus();

  if (!user) return null;

  const nextActive = !user.isActive;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(v) => (v ? null : onClose())}
      title={nextActive ? "Enable account" : "Disable account"}
      description={
        nextActive
          ? `Re-enable access for ${user.email}.`
          : `Disable access for ${user.email}. They will not be able to log in.`
      }
      confirmLabel={nextActive ? "Enable" : "Disable"}
      variant={nextActive ? "default" : "destructive"}
      loading={mutation.isPending}
      onConfirm={async () => {
        await mutation.mutateAsync({ id: user.id, isActive: nextActive });
        onClose();
      }}
    />
  );
}
