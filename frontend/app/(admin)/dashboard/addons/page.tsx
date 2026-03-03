import { PageHeader } from '@/components/common/PageHeader';
import { AddonCatalogTable, AddAddonButton } from '@/features/admin/addons/AddonCatalogTable';

export default function AddonsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add-on Catalog"
        description="Platform-wide add-on types available to all landlords."
        action={<AddAddonButton />}
      />
      <AddonCatalogTable />
    </div>
  );
}
