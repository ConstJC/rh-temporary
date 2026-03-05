import { PageHeader } from '@/components/common/PageHeader';
import { LandlordsTable } from '@/features/admin/landlords/LandlordsTable';

export default function AdminPropertyGroupsPage() {
  return (
    <>
      <PageHeader
        title="Property Groups"
        description="All property groups. View details and suspend/reactivate accounts."
      />
      <div className="mt-4">
        <LandlordsTable />
      </div>
    </>
  );
}
