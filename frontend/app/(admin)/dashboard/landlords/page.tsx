import { PageHeader } from "@/components/common/PageHeader";
import { LandlordsTable } from "@/features/admin/landlords/LandlordsTable";
import { CreatePropertyGroupButton } from "@/features/admin/landlords/CreatePropertyGroupSheet";

export default function AdminLandlordsPage() {
  return (
    <>
      <PageHeader
        title="Landlords"
        description="All landlord property groups. View details and suspend/reactivate."
        action={<CreatePropertyGroupButton />}
      />
      <div className="mt-4">
        <LandlordsTable />
      </div>
    </>
  );
}
