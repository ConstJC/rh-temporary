'use client';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDeleteAddon } from '@/features/admin/hooks/useAdminAddons';
import type { AddonCatalog } from '@/types/domain.types';

interface Props {
  addon: AddonCatalog | null;
  onClose: () => void;
}

export function DeleteAddonDialog({ addon, onClose }: Props) {
  const { mutate: deleteAddon, isPending } = useDeleteAddon();

  return (
    <ConfirmDialog
      open={!!addon}
      onOpenChange={(open) => !open && onClose()}
      onConfirm={() => deleteAddon(addon!.id, { onSuccess: onClose })}
      title="Delete Add-on"
      description={`Delete "${addon?.name}"? This will remove it from the platform-wide catalog. Landlords who already use this add-on will not be affected.`}
      confirmLabel="Delete"
      variant="destructive"
      loading={isPending}
    />
  );
}
