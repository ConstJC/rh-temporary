import { PageHeader } from "@/components/common/PageHeader";
import { UsersTable } from "@/features/admin/users/UsersTable";

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="All platform users and account status."
      />
      <div className="mt-4">
        <UsersTable />
      </div>
    </>
  );
}
