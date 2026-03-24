"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { AdminPropertyGroup } from "@/types/domain.types";
import { useUpdatePropertyGroupStatus } from "@/features/admin/hooks/usePropertyGroups";

export function SuspendOrgDialog({
  group,
  open,
  onClose,
}: {
  group: AdminPropertyGroup | null;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useUpdatePropertyGroupStatus();

  if (!group) return null;

  const nextStatus = group.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(v) => (v ? null : onClose())}
      title={
        nextStatus === "SUSPENDED"
          ? "Suspend property group"
          : "Reactivate property group"
      }
      description={
        nextStatus === "SUSPENDED"
          ? `Suspend ${group.groupName}. Users may lose access to this organization.`
          : `Reactivate ${group.groupName}.`
      }
      confirmLabel={nextStatus === "SUSPENDED" ? "Suspend" : "Reactivate"}
      variant={nextStatus === "SUSPENDED" ? "destructive" : "default"}
      loading={mutation.isPending}
      onConfirm={async () => {
        await mutation.mutateAsync({ id: group.id, status: nextStatus });
        onClose();
      }}
    />
  );
}
